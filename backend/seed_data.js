require('dotenv').config();
const sql = require('./db');

const seedData = async () => {
    try {
        console.log('Seeding database...');

        // 1. Create ADMIN User
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        try {
            await sql`
                INSERT INTO users (name, email, role, is_verified, preferred_language)
                VALUES ('System Admin', ${adminEmail}, 'admin', TRUE, 'en')
            `;
            console.log(`Admin user created: ${adminEmail}`);
        } catch (err) {
            // Check for unique violation (code 23505)
            if (err.code === '23505') {
                console.log(`Admin user already exists: ${adminEmail}`);
                // Ensure role is admin
                await sql`UPDATE users SET role = 'admin' WHERE email = ${adminEmail}`;
            } else {
                throw err;
            }
        }

        // 2. Create Active Officers
        const officers = [
            { name: 'Sanitation Officer', email: 'officer.sanitation@example.com', dept: 'Sanitation' },
            { name: 'Road Officer', email: 'officer.roads@example.com', dept: 'Roads' },
            { name: 'Water Officer', email: 'officer.water@example.com', dept: 'Water Supply' }
        ];

        for (const off of officers) {
            try {
                await sql`
                    INSERT INTO users (name, email, role, department, account_status, is_verified, ai_score, ai_result)
                    VALUES (${off.name}, ${off.email}, 'officer', ${off.dept}, 'ACTIVE', TRUE, 0.95, 'PASS')
                `;
                console.log(`Officer created: ${off.name}`);
            } catch (err) {
                if (err.code === '23505') {
                    console.log(`Officer exists: ${off.email}`);
                } else {
                    console.error(`Error creating ${off.name}:`, err.message);
                }
            }
        }

        // 3. Create a Citizen
        const citizenEmail = 'citizen.test@example.com';
        let citizenId;

        try {
            const res = await sql`
                INSERT INTO users (name, email, role, is_verified)
                VALUES ('Test Citizen', ${citizenEmail}, 'citizen', TRUE)
                RETURNING id
            `;
            citizenId = res[0].id;
            console.log(`Citizen created: ${citizenEmail}`);
        } catch (err) {
            if (err.code === '23505') {
                console.log(`Citizen exists: ${citizenEmail}`);
                const res = await sql`SELECT id FROM users WHERE email = ${citizenEmail}`;
                citizenId = res[0].id;
            } else {
                throw err;
            }
        }

        // 4. Create Issues (Unassigned)
        // Check if issues exist
        const issueCheck = await sql`SELECT id FROM issues WHERE citizen_id = ${citizenId}`;

        if (issueCheck.length === 0) {
            await sql`
                INSERT INTO issues (
                    citizen_id, category, voice_text, latitude, longitude, status, ai_status, ai_confidence, ai_reason, timestamp
                ) VALUES (
                    ${citizenId}, 
                    'Sanitation', 
                    'Garbage pile accumulating near user house.', 
                    17.3850, 
                    78.4867, 
                    'Reported', 
                    'VERIFIED', 
                    0.92, 
                    'Visual confirmation of garbage.', 
                    NOW()
                )
            `;
            console.log('Created a Sanitation issue (Unassigned).');

            await sql`
                INSERT INTO issues (
                    citizen_id, category, voice_text, latitude, longitude, status, ai_status, ai_confidence, ai_reason, timestamp
                ) VALUES (
                    ${citizenId}, 
                    'Roads', 
                    'Deep pothole causing traffic issues.', 
                    17.4000, 
                    78.5000, 
                    'Reported', 
                    'VERIFIED', 
                    0.88, 
                    'Pothole detected.', 
                    NOW()
                )
            `;
            console.log('Created a Roads issue (Unassigned).');
        } else {
            console.log('Issues already exist for test citizen.');
        }

        console.log('Database seeding complete!');
        process.exit(0);

    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedData();
