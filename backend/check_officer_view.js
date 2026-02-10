require('dotenv').config();
const sql = require('./db');

const checkOfficerView = async () => {
    const email = 'sanitation.officer.2@test.com'; // The user mentioned this email

    try {
        console.log(`Checking view for: ${email}`);

        // 1. Get User ID & Dept
        const user = await sql`SELECT id, department, role FROM users WHERE email = ${email}`;
        if (user.length === 0) {
            console.log('User not found in DB!');
            process.exit(1);
        }

        console.log('User Found:', user[0]);
        const { id, department } = user[0];

        // 2. Simulate the Query used in Controller
        console.log('\n--- Simulating Controller Query ---');
        const issues = await sql`
            SELECT id, category, status, assigned_officer_id 
            FROM issues 
            WHERE 
                (LOWER(category) = LOWER(${department}) AND status IN ('Assigned', 'In Progress', 'Resolved'))
            OR 
                assigned_officer_id = ${id}
            ORDER BY 
                CASE WHEN assigned_officer_id = ${id} THEN 0 ELSE 1 END,
                created_at DESC
        `;

        console.log(`Found ${issues.length} issues.`);
        issues.forEach(i => {
            console.log(`- Issue ${i.id}: Status=${i.status}, Category=${i.category}, AssignedTo=${i.assigned_officer_id} (Is Me? ${i.assigned_officer_id === id})`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkOfficerView();
