const sql = require('../db');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const { translateText, translateAndDetect } = require('../services/translationService');

const AI_BASE = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ===============================
// REPORT ISSUE
// ===============================
exports.reportIssue = async (req, res) => {
    try {
        const {
            image,          // base64 from frontend
            voiceText,
            language,
            latitude,
            longitude,
            status,
            timestamp
        } = req.body;

        const citizen_id = req.user.id;

        // ------------------------------
        // 1️⃣ Validation
        // ------------------------------
        if (!image || !latitude || !longitude) {
            return res.status(400).json({
                message: 'Image and location are required'
            });
        }

        // ------------------------------
        // 2️⃣ Upload image to Cloudinary (FAST CDN)
        // ------------------------------
        let imageUrl = '';

        try {
            // Check if image is base64 (starts with data:image)
            if (image.startsWith('data:image')) {
                const uploadResult = await cloudinary.uploader.upload(image, {
                    folder: 'civic_issues',
                    resource_type: 'image'
                });
                imageUrl = uploadResult.secure_url;
            } else {
                // If already a URL (rare but possible), just use it
                imageUrl = image;
            }

        } catch (err) {
            console.error('Cloudinary upload failed:', err.message);
            // Fallback: If upload fails, we might still want to save, BUT it's heavy.
            // For now, let's return error to user.
            return res.status(500).json({ message: 'Image upload failed' });
        }

        // ------------------------------
        // 2.5 Translate Text
        // ------------------------------
        let translations = {};
        let languageDetected = 'en';
        let originalDetectedLanguage = 'en';

        if (voiceText) {
            try {
                const translationResult = await translateAndDetect(voiceText);
                translations = translationResult.translations;
                originalDetectedLanguage = translationResult.detectedLanguage;
                languageDetected = translationResult.detectedLanguage; // Mapping to existing 'language' column

                // Ensure English exists (User requirement)
                if (!translations.en) translations.en = voiceText;

            } catch (transErr) {
                console.error("Translation failed:", transErr.message);
                translations = { en: voiceText, hi: voiceText, te: voiceText };
            }
        }

        // ------------------------------
        // 3️⃣ Call AI Service
        // ------------------------------
        let aiResult = {
            category: 'Uncategorized',
            ai_status: 'PENDING',
            ai_confidence: 0,
            ai_reason: 'AI service unavailable'
        };

        try {
            const aiResponse = await axios.post(
                `${AI_BASE}/analyze`,
                {
                    image,
                    text: (translations && translations.en) ? translations.en : (voiceText || '') // Enforce English for AI
                },
                { timeout: 15000 }
            );

            if (aiResponse.data) {
                aiResult = aiResponse.data;
            }
        } catch (err) {
            console.error('AI Service Error:', err.message);
        }

        // ------------------------------
        // 4️⃣ Determine Status & Check DUPLICATES
        // ------------------------------
        let issueStatus = 'Reported';
        let masterIssueId = null;

        // If AI explicitly says FLAGGED or confidence is low
        if (aiResult.ai_status === 'FLAGGED' || aiResult.category === 'Flagged' || (aiResult.ai_confidence > 0 && aiResult.ai_confidence < 0.35)) {
            issueStatus = 'Flagged';
        } else {
            // Only check for duplicates if it's a valid, Verified issue
            try {
                // Step 1: Candidate Filtering (DB Level)
                // Use English description for better matching
                const candidates = await sql`
                    SELECT id, description->>'en' as voice_text, latitude, longitude,
                    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_diff
                    FROM issues
                    WHERE category = ${aiResult.category}
                    AND status IN ('Reported', 'In Progress', 'Verified')
                    AND created_at >= NOW() - INTERVAL '7 days'
                    AND (
                        6371 * acos(
                            cos(radians(${latitude})) * cos(radians(latitude)) *
                            cos(radians(longitude) - radians(${longitude})) +
                            sin(radians(${latitude})) * sin(radians(latitude))
                        )
                    ) <= 0.2
                `;

                if (candidates.length > 0) {
                    // Step 2: Call AI Semantic Check
                    const dupCheck = await axios.post(`${AI_BASE}/check-duplicate`, {
                        new_text: (translations && translations.en) ? translations.en : (voiceText || ''), // Enforce English for DupCheck
                        new_lat: latitude,
                        new_lng: longitude,
                        candidates: candidates.map(c => ({
                            id: c.id,
                            text: c.voice_text, // This is now English from the query alias
                            latitude: parseFloat(c.latitude),
                            longitude: parseFloat(c.longitude),
                            hours_diff: parseFloat(c.hours_diff)
                        }))
                    });

                    if (dupCheck.data.is_duplicate) {
                        issueStatus = 'Duplicate';
                        masterIssueId = dupCheck.data.master_issue_id;
                        console.log(`Duplicate detected! Linked to Master ID: ${masterIssueId}, Score: ${dupCheck.data.score}`);
                    }
                }
            } catch (dupErr) {
                console.error("Duplicate check failed:", dupErr.message);
                // Fail safe: proceed as new issue
            }
        }

        // ------------------------------
        // 5️⃣ Save Issue in DB
        // ------------------------------
        const issues = await sql`
            INSERT INTO issues (
                citizen_id,
                image,
                voice_text,
                language,
                original_language,
                description,
                category,
                latitude,
                longitude,
                status,
                timestamp,
                ai_status,
                ai_confidence,
                ai_reason,
                master_issue_id,
                assigned_officer_id,
                assigned_at
            ) VALUES (
                ${citizen_id},
                ${imageUrl},
                ${voiceText || ''},
                ${languageDetected || 'en'},
                ${originalDetectedLanguage || 'en'},
                ${JSON.stringify(translations || {})},
                ${aiResult.category},
                ${latitude},
                ${longitude},
                ${issueStatus},
                ${timestamp || new Date()},
                ${aiResult.ai_status},
                ${aiResult.ai_confidence},
                ${aiResult.ai_reason},
                ${masterIssueId},
                ${null},
                ${null}
            )
            RETURNING id, category, status, timestamp, ai_status, master_issue_id, assigned_officer_id
        `;

        const newIssueId = issues[0].id;

        // ------------------------------
        // 5.5 👮 Officer Assignment (Post-Insert)
        // ------------------------------
        if (issueStatus === 'Reported' && !masterIssueId) {
            try {
                const assignmentService = require('../services/assignmentService');
                const assignedOfficer = await assignmentService.assignOfficerToIssue(
                    newIssueId,
                    aiResult.category,
                    Number(latitude),
                    Number(longitude)
                );

                if (assignedOfficer) {
                    const refreshedIssue = await sql`
                        SELECT id, category, status, timestamp, ai_status, master_issue_id, assigned_officer_id
                        FROM issues
                        WHERE id = ${newIssueId}
                    `;
                    if (refreshedIssue.length > 0) {
                        issues[0] = refreshedIssue[0];
                        issueStatus = refreshedIssue[0].status;
                    }
                }
            } catch (assignErr) {
                console.error('Officer assignment failed:', assignErr.message);
            }
        }

        // ------------------------------
        // 6️⃣ Update Crowdsourcing Map & Impact Metrics
        // ------------------------------
        // If masterIssueId exists, use that.
        const trackingId = masterIssueId || newIssueId;

        try {
            // Insert into issue_citizens
            await sql`
                INSERT INTO issue_citizens (issue_id, citizen_id)
                VALUES (${trackingId}, ${citizen_id})
                ON CONFLICT DO NOTHING
            `;

            // If Duplicate, increment affected_citizen_count on Master Issue
            if (masterIssueId) {
                await sql`
                    UPDATE issues 
                    SET affected_citizen_count = affected_citizen_count + 1 
                    WHERE id = ${masterIssueId}
                `;
                console.log(`[Impact] Incremented affected count for Master Issue ${masterIssueId}`);
            }

        } catch (mapErr) {
            console.error("Failed to update impact metrics:", mapErr.message);
        }

        // Notification Logic
        const { sendNotification } = require('../services/notificationService');
        if (issueStatus === 'Flagged') {
            await sendNotification(citizen_id, "Issue Flagged", "Your report has been flagged for manual review.");
        } else if (issueStatus === 'Duplicate') {
            await sendNotification(citizen_id, "Duplicate Detected", "Your report was linked to an existing issue.");
        } else {
            // "Your issue has been verified"
            await sendNotification(citizen_id, "Issue Verified", "Your issue has been verified.");
        }

        res.status(201).json({
            message: issueStatus === 'Flagged' ? 'Issue flagged for review'
                : issueStatus === 'Duplicate' ? 'Report linked to existing issue'
                    : 'Issue reported successfully',
            issue: issues[0]
        });

    } catch (err) {
        console.error('Error reporting issue:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getLocalizedText = (obj, lang) => {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj['en'] || Object.values(obj)[0] || '';
};

const isCitizenOrOfficer = (role) => ['citizen', 'officer'].includes(role);

exports.addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;
        const userId = req.user.id;

        if (!isCitizenOrOfficer(req.user.role)) {
            return res.status(403).json({ message: 'Only citizens and officers can comment on issues' });
        }

        if (!comment || !comment.trim()) {
            return res.status(400).json({ message: 'Comment cannot be empty' });
        }

        const issue = await sql`SELECT id FROM issues WHERE id = ${id}`;
        if (issue.length === 0) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        const insertedComment = await sql`
            INSERT INTO issue_comments (issue_id, user_id, comment)
            VALUES (${id}, ${userId}, ${comment.trim()})
            RETURNING id, issue_id, user_id, comment, created_at
        `;

        res.status(201).json({ comment: insertedComment[0] });
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (!isCitizenOrOfficer(req.user.role)) {
            return res.status(403).json({ message: 'Only citizens and officers can like issues' });
        }

        const issue = await sql`SELECT id FROM issues WHERE id = ${id}`;
        if (issue.length === 0) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        const existingLike = await sql`
            SELECT id FROM issue_likes
            WHERE issue_id = ${id} AND user_id = ${userId}
        `;

        if (existingLike.length > 0) {
            await sql`
                DELETE FROM issue_likes WHERE id = ${existingLike[0].id}
            `;
            return res.json({ liked: false });
        }

        await sql`
            INSERT INTO issue_likes (issue_id, user_id)
            VALUES (${id}, ${userId})
        `;

        res.json({ liked: true });
    } catch (err) {
        console.error('Error toggling like:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const { issueId, commentId } = req.params;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admin can remove comments' });
        }

        const comment = await sql`
            SELECT id FROM issue_comments
            WHERE id = ${commentId} AND issue_id = ${issueId}
        `;

        if (comment.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        await sql`
            DELETE FROM issue_comments
            WHERE id = ${commentId}
        `;

        res.json({ message: 'Comment removed successfully' });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMyIssues = async (req, res) => {
    try {
        const citizen_id = req.user.id;
        // Optimize: Exclude 'image' column to speed up list loading
        // Filter out FLAGGED issues from citizen view
        const issues = await sql`
            SELECT id, category, status, timestamp, voice_text, description, latitude, longitude, language, created_at, ai_status 
            FROM issues 
            WHERE citizen_id = ${citizen_id} AND status != 'Flagged'
            ORDER BY created_at DESC
        `;

        const userLang = req.user.language || req.user.preferred_language || 'en';

        const localizedIssues = issues.map(issue => {
            const desc = getLocalizedText(issue.description, userLang);
            return {
                ...issue,
                description: desc || issue.voice_text, // Return text only
                voice_text: desc || issue.voice_text, // Legacy support
                // Clean up raw JSON to prevent leaking all languages
                original_language: undefined
            };
        });

        res.json(localizedIssues);
    } catch (err) {
        console.error('Error fetching issues:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllIssues = async (req, res) => {
    try {
        const { search, status, category } = req.query;
        const userLang = req.user.language || req.user.preferred_language || 'en';

        const whereClauses = [sql`status != 'Flagged'`];
        const bindings = [];

        if (status) {
            whereClauses.push(sql`LOWER(status) = LOWER(${status})`);
        }

        if (category) {
            whereClauses.push(sql`LOWER(category) = LOWER(${category})`);
        }

        if (search) {
            const searchTerm = `%${search}%`;
            whereClauses.push(sql`(
                LOWER(COALESCE(voice_text, '')) LIKE LOWER(${searchTerm})
                OR LOWER(COALESCE(CASE WHEN json_typeof(description) = 'object' THEN description->>'en' ELSE description END, '')) LIKE LOWER(${searchTerm})
            )`);
        }

        const issues = await sql`
            SELECT id, category, status, timestamp, voice_text, description, latitude, longitude, language, created_at, ai_status
            FROM issues
            WHERE ${sql.join(whereClauses, sql` AND `)}
            ORDER BY created_at DESC
        `;

        const localizedIssues = issues.map(issue => {
            const desc = getLocalizedText(issue.description, userLang);
            return {
                ...issue,
                description: desc || issue.voice_text,
                voice_text: desc || issue.voice_text
            };
        });

        res.json(localizedIssues);
    } catch (err) {
        console.error('Error fetching all issues:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getIssueDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const issues = await sql`
            SELECT i.*, 
                   u.name as officer_name,
                   u.department as officer_department,
                   CASE WHEN ic.citizen_id IS NOT NULL THEN true ELSE false END as is_linked
            FROM issues i
            LEFT JOIN users u ON i.assigned_officer_id = u.id
            LEFT JOIN issue_citizens ic ON i.id = ic.issue_id AND ic.citizen_id = ${userId}
            WHERE i.id = ${id}
        `;

        if (issues.length === 0) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        const issue = issues[0];
        const allowedToView = issue.citizen_id === userId
            || issue.assigned_officer_id === userId
            || issue.is_linked
            || req.user.role === 'admin';

        if (!allowedToView) {
            return res.status(403).json({ message: 'Unauthorized access to this issue' });
        }

        const userLang = req.user.language || req.user.preferred_language || 'en';

        const desc = getLocalizedText(issue.description, userLang);
        issue.description = desc || issue.voice_text;
        issue.voice_text = desc || issue.voice_text;

        if (issue.resolution_note) {
            issue.resolution_note = getLocalizedText(issue.resolution_note, userLang);
        }

        const comments = await sql`
            SELECT c.id, c.comment, c.created_at, u.id as user_id, u.name, u.role
            FROM issue_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.issue_id = ${id}
            ORDER BY c.created_at ASC
        `;

        const likesCount = await sql`
            SELECT COUNT(*)::INT AS total_likes
            FROM issue_likes
            WHERE issue_id = ${id}
        `;

        const userLike = await sql`
            SELECT 1
            FROM issue_likes
            WHERE issue_id = ${id} AND user_id = ${userId}
            LIMIT 1
        `;

        issue.comments = comments;
        issue.likes = likesCount[0]?.total_likes || 0;
        issue.user_liked = userLike.length > 0;

        res.json(issue);
    } catch (err) {
        console.error('Error fetching issue details:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin function to get ALL details (just in case needed here, though adminController usually handles it)
exports.getAllIssues = async (req, res) => {
    // This logic is usually in adminController, checking just in case.
};

exports.assignIssue = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admin can assign officers to issues' });
        }

        const { id } = req.params;
        const { officerId } = req.body;

        if (!officerId) {
            return res.status(400).json({ message: 'Officer ID is required' });
        }

        // Verify officer exists and is active
        const officer = await sql`
            SELECT id, email, account_status, department FROM users 
            WHERE id = ${officerId} AND role = 'officer'
        `;

        if (officer.length === 0) {
            return res.status(404).json({ message: 'Officer not found' });
        }

        if (officer[0].account_status !== 'ACTIVE') {
            return res.status(400).json({ message: 'Officer is not active' });
        }

        const updatedIssue = await sql`
            UPDATE issues
            SET 
                assigned_officer_id = ${officerId},
                assigned_at = NOW(),
                status = 'Assigned'
            WHERE id = ${id}
            RETURNING *
        `;

        if (updatedIssue.length === 0) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        console.log(`[Admin Audit] Admin manually assigned Issue ${id} to ${officer[0].email} (${officer[0].department})`);

        res.json({
            message: `Issue assigned to ${officer[0].email}`,
            issue: updatedIssue[0]
        });

    } catch (err) {
        console.error('Error assigning issue:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
