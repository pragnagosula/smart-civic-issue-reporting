const sql = require('./db');

async function checkUsers() {
    try {
        const users = await sql`SELECT * FROM users`;
        console.log(`Current Users (${users.length}):`);
        users.forEach(u => console.log(` - ${u.email} (${u.role})`));
        process.exit(0);
    } catch (err) {
        console.error("❌ Error checking users:", err.message);
        process.exit(1);
    }
}

checkUsers();
