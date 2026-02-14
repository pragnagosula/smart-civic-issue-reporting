const sql = require('../db');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;

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
                'http://localhost:8000/analyze',
                {
                    image, // Sending base64 to AI if needed in future
                    text: voiceText || ''
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
                // Same category, within 7 days, ~200m radius (using Haversine approximation in SQL)
                // 6371 * acos(...) is standard formula.
                const candidates = await sql`
                    SELECT id, voice_text, latitude, longitude,
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
                    const dupCheck = await axios.post('http://localhost:8000/check-duplicate', {
                        new_text: voiceText || '',
                        new_lat: latitude,
                        new_lng: longitude,
                        candidates: candidates.map(c => ({
                            id: c.id,
                            text: c.voice_text,
                            latitude: parseFloat(c.latitude),
                            longitude: parseFloat(c.longitude),
                            hours_diff: parseFloat(c.hours_diff)
                        }))
                    });

                    if (dupCheck.data.is_duplicate) {
                        issueStatus = 'Duplicate'; // Or keep 'Reported' but implied duplicate
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
        // 4.5 👮 Officer Assignment (One-Time)
        // ------------------------------
        // Only run if Verified (Reported) and NOT a Duplicate
        let assignedOfficerId = null;
        let assignedAt = null;

        if (issueStatus === 'Reported' && !masterIssueId) {
            try {
                // Use new Auto-Assign Service
                const assignmentService = require('../services/assignmentService');
                const officer = await assignmentService.assignOfficerToIssue(null, aiResult.category, latitude, longitude);
                // Note: assignOfficerToIssue needs an ID to update.
                // But here we haven't INSERTED yet.
                // Logic change: We should FIND the officer first, then INSERT with the ID.

                // Let's use `findBestOfficer` directly here to get ID for INSERT.
                // Then we don't need to update later.
                const bestOfficer = await assignmentService.findBestOfficer(aiResult.category, latitude, longitude);

                if (bestOfficer) {
                    assignedOfficerId = bestOfficer.id;
                    issueStatus = 'Assigned'; // Update status immediately
                    assignedAt = new Date();
                    console.log(`[Report] Auto-assigned to ${bestOfficer.name}`);
                }

            } catch (assignErr) {
                console.error("Officer assignment failed:", assignErr.message);
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
                ${language || 'en'},
                ${aiResult.category},
                ${latitude},
                ${longitude},
                ${issueStatus},
                ${timestamp || new Date()},
                ${aiResult.ai_status},
                ${aiResult.ai_confidence},
                ${aiResult.ai_reason},
                ${masterIssueId},
                ${assignedOfficerId},
                ${assignedAt}
            )
            RETURNING id, category, status, timestamp, ai_status, master_issue_id, assigned_officer_id
        `;

        const newIssueId = issues[0].id;

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
            await sendNotification(citizenId, "Issue Flagged", "Your report has been flagged for manual review.");
        } else if (issueStatus === 'Duplicate') {
            await sendNotification(citizenId, "Duplicate Detected", "Your report was linked to an existing issue.");
        } else {
            // "Your issue has been verified"
            await sendNotification(citizenId, "Issue Verified", "Your issue has been verified.");
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

exports.getMyIssues = async (req, res) => {
    try {
        const citizen_id = req.user.id;
        // Optimize: Exclude 'image' column to speed up list loading
        // Filter out FLAGGED issues from citizen view
        const issues = await sql`
            SELECT id, category, status, timestamp, voice_text, latitude, longitude, language, created_at, ai_status 
            FROM issues 
            WHERE citizen_id = ${citizen_id} AND status != 'Flagged'
            ORDER BY created_at DESC
        `;
        res.json(issues);
    } catch (err) {
        console.error('Error fetching issues:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getIssueDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const citizen_id = req.user.id;

        // Check if user is authorized (Reporter OR Crowdsourced)
        // We use a LEFT JOIN on issue_citizens to check linkage
        // Also LEFT JOIN users to get Officer Name
        const issues = await sql`
            SELECT i.*, 
                   u.name as officer_name,
                   u.department as officer_department,
                   CASE WHEN ic.citizen_id IS NOT NULL THEN true ELSE false END as is_linked
            FROM issues i
            LEFT JOIN users u ON i.assigned_officer_id = u.id
            LEFT JOIN issue_citizens ic ON i.id = ic.issue_id AND ic.citizen_id = ${citizen_id}
            WHERE i.id = ${id}
        `;

        if (issues.length === 0) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        const issue = issues[0];

        // Authorization Check
        if (issue.citizen_id !== citizen_id && !issue.is_linked) {
            return res.status(403).json({ message: 'Unauthorized access to this issue' });
        }

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
