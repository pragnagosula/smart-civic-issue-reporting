const sql = require('./db');

async function seedAdmin() {
    try {
        await sql`
            INSERT INTO users (name, email, role, account_status, is_verified, preferred_language) 
            VALUES ('System Admin', 'sneha.amballa0804@gmail.com', 'admin', 'ACTIVE', true, 'en')
            ON CONFLICT (email) DO UPDATE SET 
                role = 'admin',
                account_status = 'ACTIVE'
        `;
        console.log("✅ ADMIN USER RECORD SYNCED: sneha.amballa0804@gmail.com is an admin.");
        process.exit(0);
    } catch (err) {
        console.error("❌ FAILED TO SYNC ADMIN:", err.message);
        process.exit(1);
    }
}

seedAdmin();
