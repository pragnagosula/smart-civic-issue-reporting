const sql = require('../db');
const { sendNotification } = require('../services/notificationService');
const { assignOfficerToIssue } = require('../services/assignmentService');
const { sendEmail } = require('../utils/emailService');

exports.submitFeedback = async (req, res) => {
    try {
        const { issueId } = req.params;
        const { response, comment } = req.body;
        const citizenId = req.user.id; // From Token

        // 1. Validation
        if (!['Resolved', 'Not Resolved'].includes(response)) {
            return res.status(400).json({ message: "Invalid response" });
        }

        // 2. Insert Feedback (Unique constraint handles duplicates)
        try {
            await sql`
                INSERT INTO issue_feedback (issue_id, citizen_id, response, comment)
                VALUES (${issueId}, ${citizenId}, ${response}, ${comment})
            `;
        } catch (dbErr) {
            if (dbErr.code === '23505') return res.status(400).json({ message: "You have already submitted feedback." });
            throw dbErr;
        }

        // 3. Notification to Citizen
        await sendNotification(citizenId, "Feedback Submitted", "Thank you for your feedback.");

        // 4. Decision Logic
        const feedbacks = await sql`SELECT response FROM issue_feedback WHERE issue_id = ${issueId}`;
        const total = feedbacks.length;
        const resolvedCount = feedbacks.filter(f => f.response === 'Resolved').length;
        const notResolvedCount = feedbacks.filter(f => f.response === 'Not Resolved').length;

        // Fetch Issue Info
        const issueRes = await sql`SELECT id, assigned_officer_id, category, latitude, longitude FROM issues WHERE id = ${issueId}`;
        if (issueRes.length === 0) return res.status(404).json({ message: "Issue not found" });
        const issue = issueRes[0];

        let newStatus = null;

        // Simple Majority Rule implementation
        // Only update if absolute majority or tie detected 
        if (resolvedCount > notResolvedCount) {
            newStatus = 'Closed';
            await sendNotification(citizenId, "Issue Closed", "Based on community feedback, this issue is now Closed.");
        } else if (notResolvedCount > resolvedCount) {
            newStatus = 'Reopened';
            // "Issue re-enters automatic assignment workflow"
            // Notify old officer
            if (issue.assigned_officer_id) {
                await sendNotification(issue.assigned_officer_id, "Escalation Alert", "Issue reopened by citizen feedback (Majority: Not Resolved).");
            }

            // Auto-Assign (Exclude current)
            await assignOfficerToIssue(
                issue.id,
                issue.category,
                Number(issue.latitude),
                Number(issue.longitude),
                [issue.assigned_officer_id]
            );

        } else if (resolvedCount === notResolvedCount && total > 1) {
            // Mixed Feedback / Tie -> Flagged
            newStatus = 'Flagged';
            if (process.env.ADMIN_EMAIL) {
                await sendEmail(process.env.ADMIN_EMAIL, "Moderation Alert: Mixed Feedback", `Issue ${issueId} has mixed feedback and needs review.`);
            }
        }

        // Update Issue Status if changed
        if (newStatus) {
            await sql`UPDATE issues SET status = ${newStatus} WHERE id = ${issueId}`;
        }

        res.json({ message: "Feedback submitted successfully", current_status: newStatus || 'Pending Feedback' });

    } catch (err) {
        console.error("Feedback Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
