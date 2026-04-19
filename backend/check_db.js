const sql = require('./db');

async function checkDatabase() {
    try {
        const users = await sql`SELECT count(*) FROM users`;
        const issues = await sql`SELECT count(*) FROM issues`;
        const feedback = await sql`SELECT count(*) FROM feedback`;
        
        console.log("Database Status Report:");
        console.log(` - Users: ${users[0].count}`);
        console.log(` - Issues: ${issues[0].count}`);
        console.log(` - Feedback: ${feedback[0].count}`);
        
        process.exit(0);
    } catch (err) {
        console.error("❌ Error checking database:", err.message);
        process.exit(1);
    }
}

checkDatabase();
