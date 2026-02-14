const sql = require('../db');
const { sendNotification } = require('../services/notificationService');
const { assignOfficerToIssue } = require('../services/assignmentService');
const { sendEmail } = require('../utils/emailService');

exports.submitFeedback = async (req, res) => {
    try {
        const { issueId } = req.params;
        const { response, comment, rating } = req.body;
        const citizenId = req.user.id; // From Token

        // 1. Validation
        if (!['Resolved', 'Not Resolved'].includes(response)) {
            return res.status(400).json({ message: "Invalid response" });
        }

        // Rating Validation (1-5, Optional but good to enforce if provided)
        let safeRating = null;
        if (rating && !isNaN(rating) && rating >= 1 && rating <= 5) {
            safeRating = parseInt(rating);
        }

        // 2. Identify and Update Feedback in issue_citizens
        // First check if user is linked to this issue (either as reporter or crowdsourced)
        const checkLink = await sql`
            SELECT * FROM issue_citizens 
            WHERE issue_id = ${issueId} AND citizen_id = ${citizenId}
        `;

        if (checkLink.length === 0) {
            // Check if they are the ORIGINAL reporter (who might not be in issue_citizens table if logic failed previously?)
            // Ideally, original reporter should be in issue_citizens. If not, insert them now to track feedback.
            const issueCheck = await sql`SELECT citizen_id FROM issues WHERE id = ${issueId}`;
            if (issueCheck.length > 0 && issueCheck[0].citizen_id === citizenId) {
                // Insert into issue_citizens if missing
                await sql`
                    INSERT INTO issue_citizens (issue_id, citizen_id, feedback_status, feedback_comment, rating)
                    VALUES (${issueId}, ${citizenId}, ${response}, ${comment}, ${safeRating})
                    ON CONFLICT (issue_id, citizen_id) 
                    DO UPDATE SET feedback_status = ${response}, feedback_comment = ${comment}, rating = ${safeRating}
                `;
            } else {
                return res.status(403).json({ message: "You are not authorized to give feedback on this issue." });
            }
        } else {
            // Update existing record
            await sql`
                UPDATE issue_citizens 
                SET feedback_status = ${response}, feedback_comment = ${comment}, rating = ${safeRating}
                WHERE issue_id = ${issueId} AND citizen_id = ${citizenId}
            `;
        }

        // 3. Notification to Citizen
        await sendNotification(citizenId, "Feedback Recorded", "Thank you! Your feedback helps us verify resolutions.");

        // 4. Decision Logic (Wait... do we need to check ALL citizens?)
        // Fetch ALL feedbacks for this issue
        const allFeedbacks = await sql`
            SELECT feedback_status FROM issue_citizens 
            WHERE issue_id = ${issueId}
        `;

        // If it's a "Normal" issue (only 1 citizen), 1 vote is 100%.
        // If "Duplicate", could be many.

        const totalVotes = allFeedbacks.filter(f => f.feedback_status !== 'PENDING' && f.feedback_status !== null).length;
        const totalCitizens = allFeedbacks.length;

        // "Only if more than 60% of the people tells it as finished or gives positive feedback"
        // Interpretation: 60% of *respondents* or 60% of *total linked citizens*?
        // Usually, in voting, it's % of *votes cast*. But for civic tech, we might want significant approval.
        // Let's go with % of votes cast, provided at least 1 vote exists.

        if (totalVotes === 0) {
            return res.json({ message: "Feedback recorded", current_status: 'Resolved (Pending more feedback)' });
        }

        const yesVotes = allFeedbacks.filter(f => f.feedback_status === 'Resolved').length;
        const noVotes = allFeedbacks.filter(f => f.feedback_status === 'Not Resolved').length;
        const approvalRate = yesVotes / totalVotes;

        // Fetch Issue Info
        const issueRes = await sql`SELECT id, assigned_officer_id, category, latitude, longitude, reopen_count, status FROM issues WHERE id = ${issueId}`;
        const issue = issueRes[0];

        // 🛡️ RESOLUTION INTEGRITY LOCK
        if (issue.status === 'Closed') {
            return res.status(403).json({ message: "This issue is already Closed. No further feedback accepted." });
        }

        let newStatus = null;

        if (approvalRate >= 0.6) {
            // ✅ Case: > 60% Approval -> CLOSED
            newStatus = 'Closed';
            // Notify linked citizens
            const linkedCitizens = await sql`SELECT citizen_id FROM issue_citizens WHERE issue_id = ${issueId}`;
            for (const cit of linkedCitizens) {
                await sendNotification(cit.citizen_id, "Issue Closed", "Community verification successful. This issue is now Closed.");
            }
            // Update closed_at
            await sql`UPDATE issues SET status = 'Closed', closed_at = NOW() WHERE id = ${issueId}`;

        } else if (approvalRate < 0.4) {
            // ❌ Case: No Votes Dominant
            if (noVotes > yesVotes) {
                // Check Escalation
                const currentReopens = issue.reopen_count || 0;

                if (currentReopens >= 2) {
                    // 🚨 ESCALATE TO ADMIN
                    newStatus = 'Escalated';
                    await sql`UPDATE issues SET status = 'Escalated', reopen_count = ${currentReopens + 1}, assigned_officer_id = NULL WHERE id = ${issueId}`;

                    if (process.env.ADMIN_EMAIL) {
                        await sendEmail(process.env.ADMIN_EMAIL, "Escalation Alert: Chronic Issue", `Issue ${issueId} has been reopened 3 times. Locked for Admin review.`);
                    }
                } else {
                    // Standard Reopen
                    newStatus = 'Reopened';

                    // Notify Old Officer
                    if (issue.assigned_officer_id) {
                        await sendNotification(issue.assigned_officer_id, "Feedback Alert", `Issue ${issue.id} reopened. Majority citizens rejected the resolution.`);
                    }

                    // Auto Increment reopen_count
                    await sql`UPDATE issues SET status = 'Reopened', reopen_count = ${currentReopens + 1} WHERE id = ${issueId}`;

                    // Re-Assign Logic
                    await assignOfficerToIssue(
                        issue.id,
                        issue.category,
                        Number(issue.latitude),
                        Number(issue.longitude),
                        [issue.assigned_officer_id] // Exclude previous
                    );
                }
            }
        }

        res.json({
            message: "Feedback submitted successfully",
            current_status: newStatus || 'Resolved (Verification In Progress)',
            stats: { yes: yesVotes, no: noVotes, total: totalVotes }
        });

    } catch (err) {
        console.error("Feedback Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
