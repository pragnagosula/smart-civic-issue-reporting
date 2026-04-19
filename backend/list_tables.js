const sql = require('./db');

async function listTables() {
    try {
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log("Current Database Tables:", tables.map(t => t.table_name).join(', '));
        process.exit(0);
    } catch (err) {
        console.error("❌ Error listing tables:", err.message);
        process.exit(1);
    }
}

listTables();
