const sql = require('../db');

// SLA Configuration (in Hours) - For demo purposes, maybe check minutes or use hours
const SLA_CONFIG = {
    'Sanitation': 24,
    'Roads': 48,
    'Water Supply': 24,
    'Electricity': 12,
    'Default': 48
};

// Helper: Get SLA limit in Postgres Interval string
const getSLAInterval = (category) => {
    const hours = SLA_CONFIG[category] || SLA_CONFIG['Default'];
    return `${hours} hours`;
};

/**
 * Finds the best officer for an issue based on:
 * 1. Matching Department
 * 2. Active Account Status
 * 3. Distance (Nearest)
 * 4. Workload (Least number of active assigned issues)
 * 
 * @param {string} category - Issue category (Department)
 * @param {number} lat - Issue Latitude
 * @param {number} lon - Issue Longitude
 * @param {string} excludeOfficerId - ID of officer to exclude (for reassignment)
 */
const findBestOfficer = async (category, lat, lon, excludeOfficerIds = []) => {
    try {
        // Ensure excludeOfficerIds is an array
        const exclusions = Array.isArray(excludeOfficerIds) ? excludeOfficerIds : (excludeOfficerIds ? [excludeOfficerIds] : []);

        const strictMatch = await sql`
            WITH officer_workload AS (
                SELECT assigned_officer_id, COUNT(*) as active_issues
                FROM issues
                WHERE status IN ('Assigned', 'In Progress')
                GROUP BY assigned_officer_id
            )
            SELECT u.id, u.email, u.name,
            COALESCE(ow.active_issues, 0) as workload,
            (
                6371 * acos(
                    cos(radians(${lat})) * cos(radians(u.latitude)) *
                    cos(radians(u.longitude) - radians(${lon})) +
                    sin(radians(${lat})) * sin(radians(u.latitude))
                )
            ) AS distance
            FROM users u
            LEFT JOIN officer_workload ow ON u.id = ow.assigned_officer_id
            WHERE u.role = 'officer'
            AND u.account_status = 'ACTIVE'
            AND LOWER(u.department) = LOWER(${category})
            AND COALESCE(u.current_load, 0) < COALESCE(u.max_load, 999999)
            ${exclusions.length > 0 ? sql`AND NOT (u.id = ANY(${exclusions}))` : sql``}
            ORDER BY distance ASC, workload ASC
            LIMIT 1
        `;

        if (strictMatch.length > 0) {
            return strictMatch[0];
        }

        const anyWithCapacity = await sql`
            WITH officer_workload AS (
                SELECT assigned_officer_id, COUNT(*) as active_issues
                FROM issues
                WHERE status IN ('Assigned', 'In Progress')
                GROUP BY assigned_officer_id
            )
            SELECT u.id, u.email, u.name,
            COALESCE(ow.active_issues, 0) as workload,
            (
                6371 * acos(
                    cos(radians(${lat})) * cos(radians(u.latitude)) *
                    cos(radians(u.longitude) - radians(${lon})) +
                    sin(radians(${lat})) * sin(radians(u.latitude))
                )
            ) AS distance
            FROM users u
            LEFT JOIN officer_workload ow ON u.id = ow.assigned_officer_id
            WHERE u.role = 'officer'
            AND u.account_status = 'ACTIVE'
            AND COALESCE(u.current_load, 0) < COALESCE(u.max_load, 999999)
            ${exclusions.length > 0 ? sql`AND NOT (u.id = ANY(${exclusions}))` : sql``}
            ORDER BY workload ASC, distance ASC
            LIMIT 1
        `;

        if (anyWithCapacity.length > 0) {
            return anyWithCapacity[0];
        }

        const leastLoadedActive = await sql`
            WITH officer_workload AS (
                SELECT assigned_officer_id, COUNT(*) as active_issues
                FROM issues
                WHERE status IN ('Assigned', 'In Progress')
                GROUP BY assigned_officer_id
            )
            SELECT u.id, u.email, u.name,
            COALESCE(ow.active_issues, 0) as workload,
            (
                6371 * acos(
                    cos(radians(${lat})) * cos(radians(u.latitude)) *
                    cos(radians(u.longitude) - radians(${lon})) +
                    sin(radians(${lat})) * sin(radians(u.latitude))
                )
            ) AS distance
            FROM users u
            LEFT JOIN officer_workload ow ON u.id = ow.assigned_officer_id
            WHERE u.role = 'officer'
            AND u.account_status = 'ACTIVE'
            ${exclusions.length > 0 ? sql`AND NOT (u.id = ANY(${exclusions}))` : sql``}
            ORDER BY workload ASC, distance ASC
            LIMIT 1
        `;

        return leastLoadedActive.length > 0 ? leastLoadedActive[0] : null;

    } catch (err) {
        console.error("Error finding best officer:", err);
        return null;
    }
};

/**
 * Assigns an officer to an issue.
 * Can be used for initial assignment or reassignment.
 * excludeOfficerIds can be a single ID or an array of IDs.
 */
const { sendNotification } = require('./notificationService');

const assignOfficerToIssue = async (issueId, category, lat, lon, excludeOfficerIds = []) => {
    if (!issueId) {
        console.warn('[Auto-Assign] Skipping assignment because issueId is missing.');
        return null;
    }

    const bestOfficer = await findBestOfficer(category, lat, lon, excludeOfficerIds);

    if (bestOfficer) {
        await sql`
            UPDATE issues
            SET 
                assigned_officer_id = ${bestOfficer.id},
                assigned_at = NOW(),
                status = 'Assigned'
            WHERE id = ${issueId}
        `;
        console.log(`[Auto-Assign] Issue ${issueId} assigned to ${bestOfficer.name}`);

        // NOTIFICATIONS
        // 1. To Officer
        await sendNotification(bestOfficer.id, "New Assignment", "New issue assigned near your location.");

        // 2. To Citizen (Need to fetch citizen_id)
        try {
            const issueRes = await sql`SELECT citizen_id FROM issues WHERE id = ${issueId}`;
            if (issueRes.length > 0) {
                await sendNotification(issueRes[0].citizen_id, "Officer Assigned", `An officer (${bestOfficer.name}) has been assigned to your issue.`);
            }
        } catch (e) { console.error("Notify Citizen Error:", e); }

        return bestOfficer;
    } else {
        console.log(`[Auto-Assign] No suitable officer found for Issue ${issueId}`);
        return null;
    }
};

/**
 * Background Task: Check SLAs and Reassign
 */
const checkSLAAndReassign = async () => {
    console.log('[SLA Check] Running background check for SLA breaches...');

    try {
        // Find issues that are 'Assigned' and have breached SLA
        // We iterate categories or just fetch all 'Assigned' and check dynamically.
        // Optimized: Fetch issues where (NOW - assigned_at) > specific interval.
        // Since interval varies by category, we might need a complex query or just fetch all 'Assigned' and filter in JS (easier for small scale).

        // Let's stick to fetch all 'Assigned' for simplicity in this mini-project.

        const overdueIssues = await sql`
            SELECT id, category, latitude, longitude, assigned_officer_id, assigned_at
            FROM issues
            WHERE status = 'Assigned'
        `;

        for (const issue of overdueIssues) {
            const hoursLimit = SLA_CONFIG[issue.category] || SLA_CONFIG['Default'];
            const assignedAt = new Date(issue.assigned_at);
            const now = new Date();
            const hoursDiff = (now - assignedAt) / (1000 * 60 * 60);

            if (hoursDiff > hoursLimit) {
                console.log(`[SLA Breach] Issue ${issue.id} (Category: ${issue.category}) exceeded ${hoursLimit}h limit. Reassigning...`);

                // SLA Notification
                try {
                    const c = await sql`SELECT citizen_id FROM issues WHERE id = ${issue.id}`;
                    if (c.length > 0) await sendNotification(c[0].citizen_id, "Delay Alert", "Your issue is delayed, reassignment in progress.");
                } catch (e) { }

                // Reassign logic: Exclude current officer
                await assignOfficerToIssue(
                    issue.id,
                    issue.category,
                    issue.latitude,
                    issue.longitude,
                    issue.assigned_officer_id
                );
            }
        }
    } catch (err) {
        console.error("Error in SLA Check:", err);
    }
};

module.exports = {
    assignOfficerToIssue,
    checkSLAAndReassign,
    findBestOfficer
};
