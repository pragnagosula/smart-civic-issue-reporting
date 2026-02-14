const sql = require('../db');
const axios = require('axios');
const fs = require('fs');
const pdf = require('pdf-parse');
const cloudinary = require('cloudinary').v2;
const Tesseract = require('tesseract.js');
const { sendNotification } = require('../services/notificationService');
const { sendEmail } = require('../utils/emailService');

// 🔐 Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ==============================
// OFFICER REGISTRATION
// ==============================
exports.registerOfficer = async (req, res) => {
    const file = req.file;
    console.log("Register Officer: Request received");

    try {
        const { name, email, phone, department, designation } = req.body;
        console.log("Parsed body:", { name, email, phone, department, designation });
        console.log("File details:", file ? { path: file.path, mimetype: file.mimetype, size: file.size } : "No file");

        // 1️⃣ Validate input
        if (!file) {
            return res.status(400).json({ message: 'Supporting document is required' });
        }

        console.log("Checking if user exists...");
        const userCheck = await sql`SELECT 1 FROM users WHERE email = ${email}`;
        if (userCheck.length > 0) {
            console.log("User already exists.");
            try { fs.unlinkSync(file.path); } catch (e) { console.error("Failed to delete temp file:", e); }
            return res.status(400).json({ message: 'Officer already registered with this email' });
        }

        // 2️⃣ EXTRACT TEXT FIRST (IMPORTANT)
        console.log("Starting text extraction...");
        let extractedText = "";

        if (file.mimetype === 'application/pdf') {
            try {
                const buffer = fs.readFileSync(file.path);
                const data = await pdf(buffer);
                extractedText = data.text || "";
                console.log("PDF text length:", extractedText.length);
            } catch (err) {
                console.error("PDF parse error:", err.message);
            }
        }

        // 3️⃣ OCR FALLBACK (for scanned PDFs / images)
        if (!extractedText || extractedText.trim().length < 50) {
            console.log("Running OCR fallback...");
            try {
                const ocrResult = await Tesseract.recognize(file.path, "eng");
                extractedText = ocrResult.data.text || "";
                console.log("OCR text length:", extractedText.length);
            } catch (err) {
                console.error("OCR failed:", err.message);
            }
        }

        // 4️⃣ HARD VALIDATION
        if (!extractedText || extractedText.trim().length < 100) {
            console.log("Text extraction failed or insufficient text.");
            return res.status(400).json({
                message: "Document content is not readable. Please upload a clear text-based PDF."
            });
        }

        // 5️⃣ Upload to Cloudinary (AFTER extraction)
        console.log("Uploading to Cloudinary...");
        let documentUrl;
        try {
            const uploadResult = await cloudinary.uploader.upload(file.path, {
                folder: 'officer_documents',
                resource_type: 'auto'
            });
            documentUrl = uploadResult.secure_url;
            console.log("Cloudinary Upload Success:", documentUrl);
            try { fs.unlinkSync(file.path); } catch (e) { console.error("Failed to delete temp file:", e); }
        } catch (err) {
            console.error("Cloudinary upload failed:", err.message);
            return res.status(500).json({ message: "Document upload failed: " + err.message });
        }

        // 6️⃣ AI Screening
        console.log("Calling AI Service...");
        let aiResult = {
            ai_score: 0,
            ai_result: "NOT_CHECKED",
            ai_reason: "AI Service Unavailable"
        };

        try {
            const aiPayload = {
                text: extractedText,
                department,
                designation: designation || "Officer",
                document_url: documentUrl
            };

            const aiResponse = await axios.post(
                "http://localhost:8000/screen-officer",
                aiPayload,
                { timeout: 10000 }
            );

            aiResult = aiResponse.data;
            console.log("AI Result:", aiResult);

        } catch (err) {
            console.error("AI call failed:", err.message);
            // We don't block registration if AI fails, just log it.
        }

        // 7️⃣ Decide account status based on AI Score
        let accountStatus;
        let isVerified = false;

        if (aiResult.ai_result === "APPROVED") {
            accountStatus = "ACTIVE";
            isVerified = true;
        } else if (aiResult.ai_result === "PENDING_REVIEW") {
            accountStatus = "ADMIN_REVIEW"; // 🟡 Admin only here
            isVerified = false;
        } else {
            accountStatus = "REJECTED"; // ❌ No access
            isVerified = false;
        }

        // 8️⃣ Save officer
        console.log("Inserting user into database...");
        try {
            const newUser = await sql`
                INSERT INTO users (
                    name, email, phone, role, department,
                    account_status, document_url,
                    ai_score, ai_result, ai_reason,
                    is_verified
                ) VALUES (
                    ${name}, ${email}, ${phone}, 'officer', ${department},
                    ${accountStatus}, ${documentUrl},
                    ${aiResult.ai_score}, ${aiResult.ai_result}, ${aiResult.ai_reason},
                    ${isVerified}
                )
                RETURNING *
            `;
            console.log("User inserted successfully:", newUser[0]);

            return res.status(201).json({
                message: "Officer registered successfully",
                officer: newUser[0]
            });
        } catch (dbErr) {
            console.error("Database Insert Error:", dbErr);
            throw new Error("Database error: " + dbErr.message);
        }

    } catch (err) {
        console.error("Officer registration error CRITICAL:", err);
        if (file && fs.existsSync(file.path)) {
            try { fs.unlinkSync(file.path); } catch { }
        }
        return res.status(500).json({
            message: "Server error: " + err.message,
            stack: err.stack
        });
    }
};

// ==============================
// OFFICER ISSUE MANAGEMENT
// ==============================
exports.getDepartmentIssues = async (req, res) => {
    try {
        const { department } = req.user; // From Token
        console.log("Fetching issues for department:", department);

        if (!department) {
            // Fallback: If for some reason token doesn't have dept, fetch from DB
            const user = await sql`SELECT department FROM users WHERE id = ${req.user.id}`;
            if (user.length > 0) {
                req.user.department = user[0].department;
            } else {
                return res.status(400).json({ message: "Officer department not found" });
            }
        }

        const issues = await sql`
            SELECT id, category, status, timestamp, voice_text, description, latitude, longitude, created_at, assigned_officer_id 
            FROM issues 
            WHERE 
                (LOWER(category) = LOWER(${req.user.department}) AND status IN ('Assigned', 'In Progress', 'Resolved'))
            OR 
                assigned_officer_id = ${req.user.id}
            ORDER BY 
                CASE WHEN assigned_officer_id = ${req.user.id} THEN 0 ELSE 1 END,
                created_at DESC
        `;

        const userLang = req.user.language || req.user.preferred_language || 'en';

        // Helper (duplicated for now to avoid circular deps or verify if imported)
        const getLocalizedText = (obj, lang) => {
            if (!obj) return null;
            if (typeof obj === 'string') return obj;
            return obj[lang] || obj['en'] || Object.values(obj)[0] || '';
        };

        const localizedIssues = issues.map(issue => {
            const desc = getLocalizedText(issue.description, userLang);
            return {
                ...issue,
                description: desc || issue.voice_text,
                voice_text: desc || issue.voice_text,
                // Localize note if exists
                resolution_note: getLocalizedText(issue.resolution_note, userLang) || issue.resolution_note
            };
        });

        res.json(localizedIssues);
    } catch (err) {
        console.error("Get Officer Issues Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateIssueStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['In Progress', 'Resolved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        // Fetch Current Issue Status
        const currentIssue = await sql`SELECT status, citizen_id FROM issues WHERE id = ${id}`;
        if (currentIssue.length === 0) return res.status(404).json({ message: "Issue not found" });
        const { status: currentStatus, citizen_id: citizenId } = currentIssue[0];

        // 🛡️ STATE MACHINE ENFORCEMENT
        // Report -> Assigned (System)
        // Assigned -> In Progress
        // In Progress -> Resolved
        // Resolved -> Closed (Feedback) | Reopened (Feedback)
        // Reopened -> Assigned (System)

        const allowedTransitions = {
            'Reported': ['Assigned', 'Rejected'], // Officers might pick up Reported issues directly? usually system assigns.
            'Assigned': ['In Progress', 'Rejected'],
            'In Progress': ['Resolved', 'Rejected'],
            'Resolved': [], // Officer cannot move from Resolved. Only Feedback moves it to Closed or Reopened.
            'Reopened': ['Assigned', 'In Progress', 'Rejected'], // If reassigned to same officer, they can start.
            'Closed': [], // Final State. No edits.
            'Escalated': ['Assigned', 'Resolved'] // Admin might intervene
        };

        // Check if transition is valid
        // Note: 'Rejected' logic is handled separately below but technically is a transition.
        if (currentStatus === 'Closed') {
            return res.status(403).json({ message: "Action Denied: Issue is permanently Closed." });
        }

        // Skip check if current status is same (idempotent)
        if (currentStatus !== status) {
            const validNext = allowedTransitions[currentStatus] || [];
            if (!validNext.includes(status)) {
                return res.status(400).json({
                    message: `Invalid State Transition. Cannot move from '${currentStatus}' to '${status}'.`,
                    allowed: validNext
                });
            }
        }

        // Special handling for REJECTED
        if (status === 'Rejected') {
            const officerId = req.user.id;
            const currentIssue = await sql`
                SELECT id, category, latitude, longitude, rejection_count, rejected_by 
                FROM issues WHERE id = ${id}
            `;
            if (currentIssue.length === 0) return res.status(404).json({ message: "Issue not found" });

            const issue = currentIssue[0];
            const currentCount = (issue.rejection_count || 0) + 1;
            let rejectedBy = issue.rejected_by || [];
            // Ensure unique
            if (!rejectedBy.includes(officerId)) rejectedBy.push(officerId);

            if (currentCount >= 3) {
                // ESCALATE
                const result = await sql`
                    UPDATE issues
                    SET status = 'Escalated', 
                        rejection_count = ${currentCount},
                        rejected_by = ${rejectedBy},
                        updated_at = NOW(),
                        assigned_officer_id = NULL
                    WHERE id = ${id}
                    RETURNING *
                 `;

                // Notify Admin
                if (process.env.ADMIN_EMAIL) {
                    await sendEmail(process.env.ADMIN_EMAIL, "Escalation Alert", `Issue ${id} has been rejected 3 times and is now Escalated.`);
                }
                return res.json({ message: "Issue Rejected. Max rejections reached -> Escalated to Admin.", issue: result[0] });

            } else {
                // Auto-Reassign
                await sql`
                    UPDATE issues
                    SET rejection_count = ${currentCount},
                        rejected_by = ${rejectedBy},
                        updated_at = NOW(),
                        assigned_officer_id = NULL
                    WHERE id = ${id}
                `;
                const assignmentService = require('../services/assignmentService');
                const newOfficer = await assignmentService.assignOfficerToIssue(
                    issue.id, issue.category, Number(issue.latitude), Number(issue.longitude), rejectedBy
                );

                if (newOfficer) {
                    return res.json({ message: `Issue Rejected. Reassigned to ${newOfficer.name}` });
                } else {
                    await sql`UPDATE issues SET status = 'Escalated' WHERE id = ${id}`;
                    // Notify Admin
                    if (process.env.ADMIN_EMAIL) {
                        await sendEmail(process.env.ADMIN_EMAIL, "Escalation Alert", `Issue ${id} rejected and no other officers available.`);
                    }
                    return res.json({ message: "Issue Rejected. No other officers available -> Escalated to Admin." });
                }
            }

        } else if (status === 'Resolved') {
            // ------------------------------
            // RESOLUTION WITH PROOF
            // ------------------------------
            const { image, latitude, longitude } = req.body;

            // 1. Validate Proof
            if (!image || !latitude || !longitude) {
                return res.status(400).json({ message: "Resolution proof (image) and location are required." });
            }

            // 2. Upload Proof Image to Cloudinary
            let resolutionImageUrl = '';
            try {
                if (image.startsWith('data:image')) {
                    const uploadResult = await cloudinary.uploader.upload(image, {
                        folder: 'resolution_proofs',
                        resource_type: 'image'
                    });
                    resolutionImageUrl = uploadResult.secure_url;
                } else {
                    resolutionImageUrl = image; // Should not happen in normal flow
                }
            } catch (err) {
                console.error('Resolution Image upload failed:', err.message);
                return res.status(500).json({ message: 'Failed to upload resolution document.' });
            }

            // 3. Update Database with Proof Metadata
            // - resolved_at = Server Time (NOW())
            // - resolution_lat/lng = Officer Location
            const result = await sql`
                UPDATE issues
                SET 
                    status = 'Resolved',
                    updated_at = NOW(),
                    resolved_at = NOW(),
                    resolution_image_url = ${resolutionImageUrl},
                    resolution_lat = ${latitude},
                    resolution_lng = ${longitude},
                    assigned_officer_id = ${req.user.id},
                    resolution_proof_metadata = ${JSON.stringify({ device: req.headers['user-agent'], ip: req.ip })}
                WHERE id = ${id}
                RETURNING *
            `;

            if (result.length === 0) return res.status(404).json({ message: "Issue not found" });

            // 4. Notify ALL Linked Citizens (Reporter + Crowdsourced)
            try {
                const linkedCitizens = await sql`
                    SELECT DISTINCT citizen_id FROM issue_citizens WHERE issue_id = ${id}
                `;

                // If the table is empty (legacy issues), fallback to the main citizenId
                const recipients = linkedCitizens.length > 0 ? linkedCitizens.map(r => r.citizen_id) : (citizenId ? [citizenId] : []);

                for (const citId of recipients) {
                    await sendNotification(citId, "Issue Resolved", "Title: Issue Resolved.\nMessage: Please review the resolution proof and provide feedback to close the issue.", { type: 'feedback_request', issue_id: id });
                }
            } catch (notifErr) {
                console.error("Failed to send resolution notifications:", notifErr);
            }

            res.json({ message: "Issue resolved with proof", issue: result[0] });

        } else {
            // Normal Status Update (In Progress)
            const result = await sql`
                UPDATE issues
                SET status = ${status}, updated_at = NOW(), assigned_officer_id = ${req.user.id}
                WHERE id = ${id}
                RETURNING *
            `;
            if (result.length === 0) return res.status(404).json({ message: "Issue not found" });

            // Notifications
            if (citizenId) {
                if (status === 'In Progress') {
                    await sendNotification(citizenId, "Work Started", "Work has started on your issue.");
                }
            }

            res.json({ message: "Issue updated", issue: result[0] });
        }

    } catch (err) {
        console.error("Update Issue Status Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
