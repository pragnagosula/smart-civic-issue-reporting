require('dotenv').config();
const sql = require('./db');
const { assignOfficerToIssue, checkSLAAndReassign } = require('./services/assignmentService');

const runTest = async () => {
    try {
        console.log('--- STARTING ASSIGNMENT SYSTEM TEST ---');

        // ---------------------------------------------------------
        // SETUP: Clean Slate for Test Users
        // ---------------------------------------------------------
        const email1 = 'sanitation.officer.1@test.com';
        const email2 = 'sanitation.officer.2@test.com';
        const citizenEmail = 'assignment.tester@test.com';

        // Cleanup previous test runs
        await sql`DELETE FROM issue_citizens WHERE citizen_id IN (SELECT id FROM users WHERE email = ${citizenEmail})`;
        await sql`DELETE FROM issues WHERE citizen_id IN (SELECT id FROM users WHERE email = ${citizenEmail})`;
        await sql`DELETE FROM users WHERE email IN (${email1}, ${email2}, ${citizenEmail})`;

        // Create Officer 1 (Sanitation)
        const off1 = await sql`
            INSERT INTO users (name, email, role, department, account_status, latitude, longitude)
            VALUES ('Sanitation Officer 1', ${email1}, 'officer', 'Sanitation', 'ACTIVE', 17.000, 78.000)
            RETURNING id, name
        `;

        // Create Officer 2 (Sanitation)
        const off2 = await sql`
            INSERT INTO users (name, email, role, department, account_status, latitude, longitude)
            VALUES ('Sanitation Officer 2', ${email2}, 'officer', 'Sanitation', 'ACTIVE', 17.000, 78.000)
            RETURNING id, name
        `;

        console.log(`\nCreated 2 Officers at same location:\n1. ${off1[0].name}\n2. ${off2[0].name}`);

        // Create Dummy Citizen
        const citizen = await sql`
            INSERT INTO users (name, email, role) 
            VALUES ('Tester', ${citizenEmail}, 'citizen') 
            RETURNING id
        `;
        const citizenId = citizen[0].id;

        // ---------------------------------------------------------
        // TEST 1: Basic Auto-Assignment
        // ---------------------------------------------------------
        console.log('\n--- TEST 1: Basic Auto-Assignment ---');

        // Insert Issue 1 (Reported)
        const issue1 = await sql`
            INSERT INTO issues (citizen_id, category, latitude, longitude, status, created_at)
            VALUES (${citizenId}, 'Sanitation', 17.001, 78.001, 'Reported', NOW())
            RETURNING id
        `;

        // Trigger Assignment Logic
        const assigned1 = await assignOfficerToIssue(issue1[0].id, 'Sanitation', 17.001, 78.001);
        console.log(`👉 Issue 1 Assigned to: ${assigned1 ? assigned1.name : 'FAILED'}`);


        // ---------------------------------------------------------
        // TEST 2: Workload Balancing
        // ---------------------------------------------------------
        console.log('\n--- TEST 2: Workload Balancing ---');

        // Identify who got the first issue
        const overloadedId = assigned1.id;
        // The other officer is the 'free' one
        const freeId = off1[0].id === overloadedId ? off2[0].id : off1[0].id;
        const freeName = off1[0].id === overloadedId ? off2[0].name : off1[0].name;

        // Artificially overload the first officer with 5 dummy assigned issues
        console.log(`loading up ${assigned1.name} with 5 more issues...`);
        for (let i = 0; i < 5; i++) {
            await sql`
                INSERT INTO issues (citizen_id, category, status, assigned_officer_id)
                VALUES (${citizenId}, 'Sanitation', 'Assigned', ${overloadedId})
            `;
        }

        // Now create a NEW Issue 2 at same location
        const issue2 = await sql`
            INSERT INTO issues (citizen_id, category, latitude, longitude, status, created_at)
            VALUES (${citizenId}, 'Sanitation', 17.001, 78.001, 'Reported', NOW())
            RETURNING id
        `;

        // The system SHOULD choose the other officer because they have less workload (0 vs 6)
        const assigned2 = await assignOfficerToIssue(issue2[0].id, 'Sanitation', 17.001, 78.001);
        console.log(`👉 Issue 2 Assigned to: ${assigned2 ? assigned2.name : 'FAILED'}`);

        if (assigned2 && assigned2.id === freeId) {
            console.log(`✅ PASS: System correctly chose ${freeName} (Lower Workload).`);
        } else {
            console.log(`❌ FAIL: System did not prioritize workload.`);
        }


        // ---------------------------------------------------------
        // TEST 3: SLA Breach & Auto-Reassignment
        // ---------------------------------------------------------
        console.log('\n--- TEST 3: SLA Breach Reassignment ---');

        // Create an OLD issue assigned to 'overloadedId' 3 days ago (Simulating Neglect)
        const slaIssue = await sql`
            INSERT INTO issues (citizen_id, category, latitude, longitude, status, assigned_officer_id, assigned_at)
            VALUES (${citizenId}, 'Sanitation', 17.001, 78.001, 'Assigned', ${overloadedId}, NOW() - INTERVAL '3 days')
            RETURNING id
        `;
        console.log(`Created Old Issue ${slaIssue[0].id} assigned to ${assigned1.name} (assigned 3 days ago).`);

        // Run the Background SLA Check
        console.log('Running SLA Check...');
        await checkSLAAndReassign();

        // Check DB to see who owns it now
        const updatedSlaIssue = await sql`
            SELECT assigned_officer_id FROM issues WHERE id = ${slaIssue[0].id}
        `;

        if (updatedSlaIssue[0].assigned_officer_id === freeId) {
            console.log(`✅ PASS: Issue detected as overdue and reassigned to ${freeName}.`);
        } else if (updatedSlaIssue[0].assigned_officer_id === overloadedId) {
            console.log(`❌ FAIL: Issue was NOT reassigned.`);
        } else {
            console.log(`? UNKNOWN: Assigned to ID: ${updatedSlaIssue[0].assigned_officer_id}`);
        }

        console.log('\n--- TEST COMPLETE ---');
        process.exit(0);

    } catch (err) {
        console.error("Test Error:", err);
        process.exit(1);
    }
};

runTest();
