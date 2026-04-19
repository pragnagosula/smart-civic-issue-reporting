const sql = require('../db');

// Multi-Level SLA Configuration (in Hours)
const SLA_CONFIG = {
    'Acknowledgment': {
        'electricity': 4,
        'streetlight': 4,
        'sanitation': 6,
        'water': 6,
        'water supply': 6,
        'roads': 12,
        'default': 12
    },
    'Action': {
        'electricity': 24,
        'streetlight': 24,
        'sanitation': 36,
        'water': 36,
        'water supply': 36,
        'roads': 72,
        'default': 72
    },
    'Resolution': {
        'electricity': 48,
        'streetlight': 48,
        'sanitation': 72,
        'water': 72,
        'water supply': 72,
        'roads': 168, // 7 days = 168 hrs
        'default': 168
    }
};

// Helper: Get SLA limit in Hours
const getSLAHours = (phase, category) => {
    const cat = category ? category.toLowerCase() : 'default';
    const limits = SLA_CONFIG[phase];
    return limits[cat] || limits['default'];
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
 * Background Task: Check Multi-Level SLAs and Track Breaches/Reassign
 */
const checkSLAAndReassign = async () => {
    console.log('[SLA Check] Running background check for Multi-Level SLA breaches...');

    try {
        // Fetch all non-closed active issues that have an assigned officer
        const overdueIssues = await sql`
            SELECT id, category, status, latitude, longitude, assigned_officer_id, 
                   assigned_at, acknowledged_at, in_progress_at, resolved_at, citizen_id
            FROM issues
            WHERE status IN ('Assigned', 'In Progress') AND assigned_at IS NOT NULL
        `;

        for (const issue of overdueIssues) {
            const cat = issue.category ? issue.category.toLowerCase() : 'default';
            const now = new Date();
            const assignedAt = new Date(issue.assigned_at);
            const hoursSinceAssignment = (now - assignedAt) / (1000 * 60 * 60);

            // 1. Check Acknowledgement SLA (Time to accept)
            // If the officer hasn't acknowledged it within the short SLA limit, it constitutes a breach and requires reassignment.
            if (!issue.acknowledged_at && issue.status === 'Assigned') {
                const ackLimit = getSLAHours('Acknowledgment', cat);
                if (hoursSinceAssignment > ackLimit) {
                    console.log(`[SLA Breach - Acknowledgment] Issue ${issue.id} exceeded ${ackLimit}h limit. Reassigning...`);
                    
                    try {
                        await sendNotification(issue.citizen_id, "Delay Alert", "Your issue response was delayed. We are reassigning it to another officer.");
                        if (process.env.ADMIN_EMAIL) {
                            await sendNotification(issue.assigned_officer_id, "SLA Breach", `You failed to acknowledge Issue #${issue.id} in time. It has been reassigned.`);
                        }
                    } catch (e) { }

                    await assignOfficerToIssue(issue.id, issue.category, issue.latitude, issue.longitude, issue.assigned_officer_id);
                    continue; // Reassigned, skip further SLA checks for this issue this round
                }
            }

            // 2. Check Action SLA (Time to move to "In Progress")
            // If the officer acknowledged it but hasn't moved it to In Progress within the moderate SLA limit.
            if (!issue.in_progress_at && issue.status !== 'In Progress') {
                const actionLimit = getSLAHours('Action', cat);
                if (hoursSinceAssignment > actionLimit) {
                    console.log(`[SLA Breach - Action] Issue ${issue.id} not set to 'In Progress' within ${actionLimit}h limit. Escalating...`);
                    
                    // Action SLA Breach might just send a fierce warning or escalate to Admin instead of instant reassignment.
                    try {
                         await sendNotification(issue.assigned_officer_id, "Warning: Action SLA Breach", `Issue #${issue.id} is overdue for Action.`);
                    } catch(e) {}
                    
                    // You can optionally reassign here as well if required by the policy.
                }
            }

            // 3. Check Resolution SLA (Time to fully fix the issue)
            // If the issue is still active (even if In Progress) and hasn't been fixed within the Long SLA limit.
            if (!issue.resolved_at) {
                const resLimit = getSLAHours('Resolution', cat);
                if (hoursSinceAssignment > resLimit) {
                    console.log(`[SLA Breach - Resolution] Issue ${issue.id} not resolved within ${resLimit}h. Escalating to Admin...`);
                    
                    // Force Status to Escalated and remove assignment
                    await sql`
                        UPDATE issues 
                        SET status = 'Escalated', updated_at = NOW(), assigned_officer_id = NULL
                        WHERE id = ${issue.id}
                    `;
                    
                    try {
                        await sendNotification(issue.citizen_id, "Escalation Alert", "Resolution is taking too long. Escalated to Administrator.");
                    } catch(e) {}
                }
            }
        }
    } catch (err) {
        console.error("Error in Multi-Level SLA Check:", err);
    }
};

module.exports = {
    assignOfficerToIssue,
    checkSLAAndReassign,
    findBestOfficer
};
