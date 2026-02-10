require('dotenv').config();
const sql = require('./db');
const { assignOfficerToIssue } = require('./services/assignmentService');

const runRejectionTest = async () => {
    try {
        console.log('--- STARTING REJECTION FLOW TEST ---');

        // 1. SETUP: Create 4 Officers in a unique department 'RejectionDept'
        const dept = 'RejectionDept';
        const commonLat = 20.0;
        const commonLon = 80.0;

        // Cleanup
        await sql`DELETE FROM users WHERE department = ${dept}`;
        await sql`DELETE FROM issues WHERE category = ${dept}`;

        const officers = [];
        for (let i = 1; i <= 4; i++) {
            const o = await sql`
                INSERT INTO users (name, email, role, department, account_status, latitude, longitude)
                VALUES (${`Officer ${i}`}, ${`off${i}@test.com`}, 'officer', ${dept}, 'ACTIVE', ${commonLat}, ${commonLon})
                RETURNING id, name, email
            `;
            officers.push(o[0]);
        }
        console.log(`Created 4 officers in ${dept}`);

        // 2. Create Issue
        const issue = await sql`
            INSERT INTO issues (category, latitude, longitude, status, created_at)
            VALUES (${dept}, ${commonLat}, ${commonLon}, 'Reported', NOW())
            RETURNING id
        `;
        const issueId = issue[0].id;
        console.log(`Created Issue ${issueId}`);

        // 3. Initial Assignment
        console.log('\n--- Initial Assignment ---');
        let assignedOfc = await assignOfficerToIssue(issueId, dept, commonLat, commonLon);
        if (!assignedOfc) throw new Error('Initial assignment failed');
        console.log(`Assigned to: ${assignedOfc.name}`);

        // Track rejections
        let rejectedBy = [];

        // 4. Simulate Rejections 1, 2, 3
        for (let i = 1; i <= 3; i++) {
            console.log(`\n--- Rejection #${i} ---`);
            const currentOfficer = assignedOfc;
            rejectedBy.push(currentOfficer.id); // Add current to reject list

            console.log(`${currentOfficer.name} rejects the issue...`);

            // REPLICATE CONTROLLER LOGIC MANUALLY (Since we are in script)
            // Logic:
            // if count >= 3 -> Escalate
            // else -> Assign(exclude rejectedBy)

            const count = i; // This is the rejection count AFTER this rejection happens

            if (count >= 3) {
                console.log('Threshold reached (3 rejections). Escalating...');
                await sql`
                    UPDATE issues 
                    SET status = 'Escalated', rejection_count = ${count}, rejected_by = ${rejectedBy}, assigned_officer_id = NULL
                    WHERE id = ${issueId}
                `;
                console.log('Status set to ESCALATED.');
                break;
            } else {
                console.log('Reassigning...');
                await sql`
                    UPDATE issues 
                    SET rejection_count = ${count}, rejected_by = ${rejectedBy}, assigned_officer_id = NULL
                    WHERE id = ${issueId}
                `;

                assignedOfc = await assignOfficerToIssue(issueId, dept, commonLat, commonLon, rejectedBy);

                if (assignedOfc) {
                    console.log(`Reassigned to: ${assignedOfc.name}`);
                } else {
                    console.log('No other officer found! (Should not happen in this test)');
                    await sql`UPDATE issues SET status = 'Escalated' WHERE id = ${issueId}`;
                    break;
                }
            }
        }

        // 5. Verify Final State
        console.log('\n--- Final Verification ---');
        const finalIssue = await sql`SELECT status, rejection_count, rejected_by FROM issues WHERE id = ${issueId}`;
        console.log('Final Issue:', finalIssue[0]);

        if (finalIssue[0].status === 'Escalated' && finalIssue[0].rejection_count === 3) {
            console.log('✅ TEST PASSED: Issue escalated exactly after 3rd rejection.');
        } else {
            console.log('❌ TEST FAILED: Incorrect state.');
        }

        process.exit(0);

    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
};

runRejectionTest();
