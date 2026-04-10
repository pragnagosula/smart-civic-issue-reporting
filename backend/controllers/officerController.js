const sql = require('../db');
const axios = require('axios');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { sendNotification } = require('../services/notificationService');
const { sendEmail } = require('../utils/emailService');

const AI_BASE = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// 🔐 Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ==============================
// OFFICER REGISTRATION (BASIC VERSION - Works without OCR service)
// ==============================
const registerOfficer = async (req, res) => {
    const file = req.file;
    console.log("\n========================================");
    console.log("📝 OFFICER REGISTRATION REQUEST");
    console.log("========================================");

    try {
        const { name, email, phone, department, designation } = req.body;
        console.log("📋 Request Details:");
        console.log(`   Name: ${name}`);
        console.log(`   Email: ${email}`);
        console.log(`   Department: ${department}`);

        if (file) {
            console.log("\n📎 Document Details:");
            console.log(`   Filename: ${file.originalname}`);
            console.log(`   Type: ${file.mimetype}`);
            console.log(`   Size: ${(file.size / 1024).toFixed(2)} KB`);
        }

        // 1️⃣ Validate input
        if (!file) {
            console.log("❌ No document uploaded");
            return res.status(400).json({ message: 'Supporting document is required' });
        }

        // 2️⃣ Check if user exists
        console.log("\n🔍 Checking for existing user...");
        const userCheck = await sql`SELECT 1 FROM users WHERE email = ${email}`;
        if (userCheck.length > 0) {
            console.log("❌ User already exists");
            try { fs.unlinkSync(file.path); } catch (e) { }
            return res.status(400).json({ message: 'Officer already registered with this email' });
        }
        console.log("✅ Email available");

        // 3️⃣ Upload to Cloudinary
        console.log("\n☁️  Uploading to Cloudinary...");
        let documentUrl;
        try {
            const uploadResult = await cloudinary.uploader.upload(file.path, {
                folder: 'officer_documents',
                resource_type: 'auto',
                context: `name=${name}|department=${department}`,
                tags: ['officer_registration', department]
            });
            documentUrl = uploadResult.secure_url;
            console.log("✅ Upload successful");
            console.log(`   URL: ${documentUrl}`);
            
            // Clean up temp file
            try { fs.unlinkSync(file.path); } catch (e) { }
        } catch (uploadError) {
            console.error("❌ Cloudinary upload failed:", uploadError.message);
            try { fs.unlinkSync(file.path); } catch (e) { }
            return res.status(500).json({ 
                message: "Document upload failed. Please try again.",
                error: uploadError.message 
            });
        }

        // 4️⃣ AI Screening (Optional - defaults to PENDING if service unavailable)
        console.log("\n🤖 Attempting AI Screening...");
        let aiResult = {
            ai_score: 0.5,
            ai_result: "PENDING_REVIEW",
            ai_reason: "Manual admin review required"
        };

        try {
            const aiPayload = {
                text: "Document uploaded for verification",
                department,
                designation: designation || "Officer",
                document_url: documentUrl
            };

            console.log("📤 Sending to AI service...");
            const aiResponse = await axios.post(
                `${AI_BASE}/screen-officer`,
                aiPayload,
                { timeout: 10000 }
            );

            aiResult = aiResponse.data;
            console.log("✅ AI screening complete");
            console.log(`   Score: ${aiResult.ai_score}`);
            console.log(`   Result: ${aiResult.ai_result}`);

        } catch (aiError) {
            console.log("⚠️  AI service unavailable - defaulting to PENDING");
        }

        // 5️⃣ Determine Account Status
        console.log("\n🎯 Determining account status...");
        let accountStatus;
        let isVerified = false;

        if (aiResult.ai_result === "APPROVED" && aiResult.ai_score >= 0.7) {
            accountStatus = "ACTIVE";
            isVerified = true;
            console.log("✅ Auto-approved");
        } else {
            accountStatus = "PENDING";
            isVerified = false;
            console.log("⏳ Pending admin review");
        }

        // 6️⃣ Save to Database
        console.log("\n💾 Saving to database...");
        try {
            const newUser = await sql`
                INSERT INTO users (
                    name, email, phone, role, department,
                    account_status, document_url,
                    ai_score, ai_result, ai_reason,
                    is_verified, designation
                ) VALUES (
                    ${name}, ${email}, ${phone}, 'officer', ${department},
                    ${accountStatus}, ${documentUrl},
                    ${aiResult.ai_score}, ${aiResult.ai_result}, ${aiResult.ai_reason},
                    ${isVerified}, ${designation || 'Officer'}
                )
                RETURNING *
            `;

            const officer = newUser[0];
            console.log("✅ Officer registered successfully");
            console.log(`   ID: ${officer.id}`);
            console.log(`   Status: ${accountStatus}`);

            // 7️⃣ Send Notifications
            console.log("\n📧 Sending notifications...");
            try {
                // Notify officer
                if (sendEmail) {
                    await sendEmail(
                        email,
                        "CivicFix - Registration Received",
                        `Dear ${name},\n\nYour officer registration has been received.\n\nStatus: ${accountStatus}\n\nYou will be notified once reviewed.\n\nBest regards,\nCivicFix Team`
                    );
                }

                // Notify admin if pending
                if (accountStatus === "PENDING" && process.env.ADMIN_EMAIL) {
                    await sendEmail(
                        process.env.ADMIN_EMAIL,
                        "New Officer Registration - Review Required",
                        `New officer registration:\n\nName: ${name}\nDepartment: ${department}\n\nPlease review in admin dashboard.`
                    );
                }
                console.log("✅ Notifications sent");
            } catch (emailError) {
                console.log("⚠️  Email notification failed:", emailError.message);
            }

            // 🎉 Success Response
            console.log("\n========================================");
            console.log("✅ REGISTRATION COMPLETE");
            console.log("========================================\n");

            return res.status(201).json({
                message: "Officer registration successful",
                officer: {
                    id: officer.id,
                    name: officer.name,
                    email: officer.email,
                    department: officer.department,
                    account_status: officer.account_status,
                    ai_result: officer.ai_result,
                    ai_score: officer.ai_score
                },
                next_steps: accountStatus === "PENDING" 
                    ? "Your application is under review. You will be notified via email once approved."
                    : "Your account is active! You can now login."
            });

        } catch (dbError) {
            console.error("❌ Database error:", dbError.message);
            throw new Error("Failed to save officer registration: " + dbError.message);
        }

    } catch (error) {
        console.error("\n❌ CRITICAL ERROR:", error.message);
        
        // Clean up file if it still exists
        if (file && fs.existsSync(file.path)) {
            try { fs.unlinkSync(file.path); } catch (e) { }
        }

        return res.status(500).json({
            message: "Registration failed due to server error",
            error: error.message
        });
    }
};

// ==============================
// OFFICER ISSUE MANAGEMENT
// ==============================
const getDepartmentIssues = async (req, res) => {
    try {
        const { department } = req.user;
        console.log("Fetching issues for department:", department);

        if (!department) {
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
                resolution_note: getLocalizedText(issue.resolution_note, userLang) || issue.resolution_note
            };
        });

        res.json(localizedIssues);
    } catch (err) {
        console.error("Get Officer Issues Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

const updateIssueStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['In Progress', 'Resolved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const currentIssue = await sql`SELECT status, citizen_id FROM issues WHERE id = ${id}`;
        if (currentIssue.length === 0) return res.status(404).json({ message: "Issue not found" });
        const { status: currentStatus, citizen_id: citizenId } = currentIssue[0];

        const allowedTransitions = {
            'Reported': ['Assigned', 'Rejected'],
            'Assigned': ['In Progress', 'Rejected'],
            'In Progress': ['Resolved', 'Rejected'],
            'Resolved': [],
            'Reopened': ['Assigned', 'In Progress', 'Rejected'],
            'Closed': [],
            'Escalated': ['Assigned', 'Resolved']
        };

        if (currentStatus === 'Closed') {
            return res.status(403).json({ message: "Action Denied: Issue is permanently Closed." });
        }

        if (currentStatus !== status) {
            const validNext = allowedTransitions[currentStatus] || [];
            if (!validNext.includes(status)) {
                return res.status(400).json({
                    message: `Invalid State Transition. Cannot move from '${currentStatus}' to '${status}'.`,
                    allowed: validNext
                });
            }
        }

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
            if (!rejectedBy.includes(officerId)) rejectedBy.push(officerId);

            if (currentCount >= 3) {
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

                if (process.env.ADMIN_EMAIL && sendEmail) {
                    await sendEmail(process.env.ADMIN_EMAIL, "Escalation Alert", `Issue ${id} has been rejected 3 times and is now Escalated.`);
                }
                return res.json({ message: "Issue Rejected. Max rejections reached -> Escalated to Admin.", issue: result[0] });

            } else {
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
                    if (process.env.ADMIN_EMAIL && sendEmail) {
                        await sendEmail(process.env.ADMIN_EMAIL, "Escalation Alert", `Issue ${id} rejected and no other officers available.`);
                    }
                    return res.json({ message: "Issue Rejected. No other officers available -> Escalated to Admin." });
                }
            }

        } else if (status === 'Resolved') {
            const { image, latitude, longitude } = req.body;

            if (!image || !latitude || !longitude) {
                return res.status(400).json({ message: "Resolution proof (image) and location are required." });
            }

            let resolutionImageUrl = '';
            try {
                if (image.startsWith('data:image')) {
                    const uploadResult = await cloudinary.uploader.upload(image, {
                        folder: 'resolution_proofs',
                        resource_type: 'image'
                    });
                    resolutionImageUrl = uploadResult.secure_url;
                } else {
                    resolutionImageUrl = image;
                }
            } catch (err) {
                console.error('Resolution Image upload failed:', err.message);
                return res.status(500).json({ message: 'Failed to upload resolution document.' });
            }

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

            try {
                const linkedCitizens = await sql`
                    SELECT DISTINCT citizen_id FROM issue_citizens WHERE issue_id = ${id}
                `;

                const recipients = linkedCitizens.length > 0 ? linkedCitizens.map(r => r.citizen_id) : (citizenId ? [citizenId] : []);

                for (const citId of recipients) {
                    await sendNotification(citId, "Issue Resolved", "Title: Issue Resolved.\nMessage: Please review the resolution proof and provide feedback to close the issue.", { type: 'feedback_request', issue_id: id });
                }
            } catch (notifErr) {
                console.error("Failed to send resolution notifications:", notifErr);
            }

            res.json({ message: "Issue resolved with proof", issue: result[0] });

        } else {
            const result = await sql`
                UPDATE issues
                SET status = ${status}, updated_at = NOW(), assigned_officer_id = ${req.user.id}
                WHERE id = ${id}
                RETURNING *
            `;
            if (result.length === 0) return res.status(404).json({ message: "Issue not found" });

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

// ==============================
// CRITICAL: PROPER MODULE EXPORTS
// ==============================
module.exports = {
    registerOfficer,
    getDepartmentIssues,
    updateIssueStatus
};