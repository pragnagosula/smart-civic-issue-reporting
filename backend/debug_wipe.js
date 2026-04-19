const sql = require('./db');

async function debugWipe() {
    try {
        console.log("1. Deleting all users...");
        await sql.unsafe('DELETE FROM users');
        
        console.log("2. Verifying deletion...");
        const remaining = await sql`SELECT * FROM users`;
        console.log(`Remaining users: ${remaining.length}`);
        
        if (remaining.length > 0) {
            console.log("List of remaining users:");
            remaining.forEach(u => console.log(` - ${u.email}`));
        } else {
             console.log("3. Table is confirmed empty. Inserting admin...");
             await sql`
                INSERT INTO users (name, email, phone, role, account_status, is_verified, preferred_language) 
                VALUES ('Super Admin', 'sneha.amballa0804@gmail.com', '9999999999', 'admin', 'ACTIVE', true, 'en')
            `;
            console.log("✅ SUCCESS.");
        }
        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR:", err.message);
        process.exit(1);
    }
}

debugWipe();
