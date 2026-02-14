const sql = require('../db');

// --- 1. Officer Profile ---
exports.getOfficerProfile = async (req, res) => {
    try {
        const officerId = req.user.id; // From auth middleware

        // A. Workload Metrics
        const workload = await sql`
            SELECT 
                COUNT(*) FILTER (WHERE assigned_officer_id = ${officerId}) AS total_assigned,
                COUNT(*) FILTER (WHERE assigned_officer_id = ${officerId} AND status IN ('Assigned', 'In Progress')) AS active_issues,
                COUNT(*) FILTER (WHERE assigned_officer_id = ${officerId} AND status = 'Closed') AS total_resolved
            FROM issues
        `;

        // B. Performance Metrics
        const performance = await sql`
            SELECT 
                AVG(EXTRACT(EPOCH FROM (resolved_at - assigned_at))/3600)::numeric(10,2) AS avg_resolution_hours,
                COUNT(*) FILTER (WHERE status = 'Reopened') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE status = 'Closed'), 0) AS reopen_rate,
                -- SLA Compliance: resolved within 48 hours (example)
                COUNT(*) FILTER (WHERE status = 'Closed' AND resolved_at <= assigned_at + INTERVAL '48 hours') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE status = 'Closed'), 0) AS sla_compliance
            FROM issues
            WHERE assigned_officer_id = ${officerId}
        `;

        // Average Rating
        const rating = await sql`
            SELECT AVG(ic.rating)::numeric(3,1) as avg_rating
            FROM issue_citizens ic
            JOIN issues i ON ic.issue_id = i.id
            WHERE i.assigned_officer_id = ${officerId}
        `;

        // C. Impact Metrics
        const impact = await sql`
            SELECT COALESCE(SUM(affected_citizen_count), 0) as total_impacted_citizens,
            MAX(affected_citizen_count) as highest_impact_issue
            FROM issues
            WHERE assigned_officer_id = ${officerId} AND status = 'Closed'
        `;

        // D. Chart Data
        // Resolution Time Trend (Last 7 days or 30 days) - Group by day
        const resolutionTrend = await sql`
            SELECT TO_CHAR(resolved_at, 'YYYY-MM-DD') as date,
                   AVG(EXTRACT(EPOCH FROM (resolved_at - assigned_at))/3600)::numeric(10,2) as avg_hours
            FROM issues
            WHERE assigned_officer_id = ${officerId} AND status = 'Closed'
            GROUP BY date
            ORDER BY date ASC
            LIMIT 30
        `;

        // Rating Distribution
        const ratingDistribution = await sql`
            SELECT rating, COUNT(*) as count
            FROM issue_citizens ic
            JOIN issues i ON ic.issue_id = i.id
            WHERE i.assigned_officer_id = ${officerId} AND ic.rating IS NOT NULL
            GROUP BY rating
            ORDER BY rating ASC
        `;

        res.json({
            workload: workload[0],
            performance: { ...performance[0], avg_rating: rating[0].avg_rating },
            impact: impact[0],
            charts: {
                resolutionTrend,
                ratingDistribution
            }
        });

    } catch (err) {
        console.error('Error fetching officer profile:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- 2. Department Analytics (Admin) ---
exports.getDepartmentAnalytics = async (req, res) => {
    try {
        // A. Issues by Category
        const issuesByCategory = await sql`
            SELECT category, COUNT(*) as count
            FROM issues
            GROUP BY category
            ORDER BY count DESC
        `;

        // B. Resolution Time Per Department (Assuming department is on users table for officers)
        // We need to join issues -> assigned_officer -> department
        const resolutionByDept = await sql`
            SELECT u.department, 
                   AVG(EXTRACT(EPOCH FROM (i.resolved_at - i.assigned_at))/3600)::numeric(10,2) as avg_resolution_hours
            FROM issues i
            JOIN users u ON i.assigned_officer_id = u.id
            WHERE i.status = 'Closed'
            GROUP BY u.department
        `;

        // C. Pending vs Resolved
        const pendingVsResolved = await sql`
            SELECT 
                COUNT(*) FILTER (WHERE status IN ('Reported', 'Assigned', 'In Progress')) as pending,
                COUNT(*) FILTER (WHERE status = 'Closed') as resolved
            FROM issues
        `;

        // D. High Impact Issues
        const highImpact = await sql`
            SELECT id, category, affected_citizen_count as impacted_citizens
            FROM issues
            ORDER BY affected_citizen_count DESC
            LIMIT 5
        `;

        // E. Officer Ranking
        const officerRanking = await sql`
            SELECT u.name, u.department,
                   AVG(ic.rating)::numeric(3,1) as avg_rating,
                   AVG(EXTRACT(EPOCH FROM (i.resolved_at - i.assigned_at))/3600)::numeric(10,2) as avg_resolution_hours,
                   COUNT(i.id) as total_resolved
            FROM users u
            JOIN issues i ON u.id = i.assigned_officer_id
            LEFT JOIN issue_citizens ic ON i.id = ic.issue_id
            WHERE u.role = 'officer' AND i.status = 'Closed'
            GROUP BY u.id
            ORDER BY avg_rating DESC NULLS LAST, avg_resolution_hours ASC
            LIMIT 10
        `;

        res.json({
            issuesByCategory,
            resolutionByDept,
            pendingVsResolved: pendingVsResolved[0],
            highImpact,
            officerRanking
        });

    } catch (err) {
        console.error('Error fetching department analytics:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- 3. Civic Health Dashboard ---
exports.getCivicHealth = async (req, res) => {
    try {
        // A. Total Active Issues
        const activeIssues = await sql`
            SELECT COUNT(*) as count FROM issues WHERE status != 'Closed'
        `;

        // B. Avg Resolution Time (City Wide)
        const avgResolutionParams = await sql`
            SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - assigned_at))/3600)::numeric(10,2) as avg_hours
            FROM issues
            WHERE status = 'Closed'
        `;

        // C. Top Recurring Issue Category
        const topRecurringParams = await sql`
            SELECT category, COUNT(*) as count
            FROM issues
            GROUP BY category
            ORDER BY count DESC
            LIMIT 1
        `;

        // D. Citizen Satisfaction Index
        const satisfactionParams = await sql`
            SELECT AVG(rating)::numeric(3,1) as score
            FROM issue_citizens
            WHERE rating IS NOT NULL
        `;

        // E. Duplicate Rate
        // distinct issues vs total reports (assuming issue_citizens tracks all reports including duplicates merged into issues)
        // If master_issue_id is used for merging, then 'issues' table has unique issues. 'issue_citizens' has all reporters.
        const duplicateStats = await sql`
            SELECT 
                (SELECT COUNT(*) FROM issue_citizens) as total_reports,
                (SELECT COUNT(*) FROM issues) as unique_issues
        `;

        let duplicateRate = 0;
        if (duplicateStats[0].total_reports > 0) {
            duplicateRate = ((duplicateStats[0].total_reports - duplicateStats[0].unique_issues) / duplicateStats[0].total_reports) * 100;
        }

        res.json({
            totalActive: activeIssues[0].count,
            avgResolutionTime: avgResolutionParams[0].avg_hours,
            topRecurringRaw: topRecurringParams[0] || null,
            satisfactionScore: satisfactionParams[0].score,
            duplicateRate: duplicateRate.toFixed(1)
        });

    } catch (err) {
        console.error('Error fetching civic health:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- 4. Citizen Profile ---
exports.getCitizenProfile = async (req, res) => {
    try {
        const citizenId = req.user.id; // From auth middleware

        // A. Reporting Stats
        const stats = await sql`
            SELECT 
                COUNT(*) FILTER (WHERE status != 'Closed') as active_issues,
                COUNT(*) FILTER (WHERE status = 'Closed') as closed_issues,
                COUNT(*) FILTER (WHERE status = 'Reopened') as reopened_issues
            FROM issues i
            JOIN issue_citizens ic ON i.id = ic.issue_id
            WHERE ic.citizen_id = ${citizenId}
        `;

        const totalReported = await sql`
            SELECT COUNT(*) as count FROM issue_citizens WHERE citizen_id = ${citizenId}
        `;

        // B. Personal Contribution Score
        // (total reports) + (duplicates linked?) + (feedback given)
        const feedbackCount = await sql`
             SELECT COUNT(*) as count FROM issue_citizens WHERE citizen_id = ${citizenId} AND feedback_status != 'PENDING'
        `;

        // Simplified scoring
        const score = parseInt(totalReported[0].count) * 10 + parseInt(feedbackCount[0].count) * 5;

        // C. Resolution Success Rate
        // Already can calc from stats

        // D. Avg Response Time
        const avgResponse = await sql`
            SELECT AVG(EXTRACT(EPOCH FROM (i.resolved_at - i.created_at))/3600)::numeric(10,2) as hours
            FROM issues i
            JOIN issue_citizens ic ON i.id = ic.issue_id
            WHERE ic.citizen_id = ${citizenId} AND i.status = 'Closed'
        `;

        // E. Recent Activity
        const recentActivity = await sql`
            SELECT 
                i.id, i.category, i.status, i.created_at, ic.feedback_status
            FROM issues i
            JOIN issue_citizens ic ON i.id = ic.issue_id
            WHERE ic.citizen_id = ${citizenId}
            ORDER BY i.created_at DESC
            LIMIT 5
        `;

        res.json({
            stats: { ...stats[0], total_reported: totalReported[0].count },
            contributionScore: score,
            avgResponseTime: avgResponse[0].hours,
            recentActivity
        });

    } catch (err) {
        console.error('Error fetching citizen profile:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
