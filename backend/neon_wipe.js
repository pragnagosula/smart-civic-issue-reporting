const sql = require('./db');

async function finalNeonWipe() {
    console.log("⚠️  Starting sequential wipe of Neon tables...");
    try {
        await sql`DELETE FROM notification_logs`;
        console.log(" - Cleared logs");
        await sql`DELETE FROM issue_feedback`;
        console.log(" - Cleared feedback");
        await sql`DELETE FROM issue_citizens`;
        console.log(" - Cleared mapping");
        await sql`DELETE FROM issue_comments`;
        console.log(" - Cleared comments");
        await sql`DELETE FROM issue_likes`;
        console.log(" - Cleared likes");
        await sql`DELETE FROM issues`;
        console.log(" - Cleared issues");
        await sql`DELETE FROM users`;
        console.log(" - Cleared users");
        
        console.log("🛠️  Verifying deletion...");
        const count = await sql`SELECT count(*) FROM users`;
        console.log(`Current users: ${count[0].count}`);
        
        if (parseInt(count[0].count) === 0) {
            console.log("🛠️  Re-seeding Admin...");
             await sql`
                INSERT INTO users (name, email, phone, role, account_status, is_verified, preferred_language) 
                VALUES ('Super Admin', 'sneha.amballa0804@gmail.com', '9999999999', 'admin', 'ACTIVE', true, 'en')
            `;
            console.log("✅ WIPE & RESTORE SUCCESSFUL.");
        } else {
            console.log("❌ CRITICAL: Table is NOT empty. Database might have protected records.");
        }
        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR:", err.message);
        process.exit(1);
    }
}

finalNeonWipe();
