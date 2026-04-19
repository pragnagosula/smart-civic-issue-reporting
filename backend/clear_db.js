const sql = require('./db');

async function absoluteWipe() {
    console.log("⚠️  Attempting ABSOLUTE wipe of all data...");
    try {
        const tables = [
            'notification_logs',
            'issue_feedback',
            'issue_citizens',
            'issue_comments',
            'issue_likes',
            'issues',
            'users'
        ];
        
        for (const table of tables) {
            console.log(` - Deleting from ${table}...`);
            await sql.unsafe(`DELETE FROM ${table}`);
        }
        
        console.log("✅ ALL DATA DELETED.");
        
        // Restore Admin
        console.log("🛠️  Restoring Admin...");
        await sql`
            INSERT INTO users (name, email, phone, role, account_status, is_verified, preferred_language) 
            VALUES ('Super Admin', 'sneha.amballa0804@gmail.com', '9999999999', 'admin', 'ACTIVE', true, 'en')
        `;
        console.log("✅ ADMIN CREATED.");
        
        process.exit(0);
    } catch (err) {
        console.error("❌ WIPE FAILED:", err.message);
        process.exit(1);
    }
}

absoluteWipe();
