require('dotenv').config();
const sql = require('./db');

const migrate = async () => {
    try {
        console.log('Migrating database for Rejection Workflow...');

        // Add rejection_count
        await sql`ALTER TABLE issues ADD COLUMN IF NOT EXISTS rejection_count INTEGER DEFAULT 0`;
        console.log("Added 'rejection_count' column.");

        // Add rejected_by (as TEXT array to store UUIDs)
        // Postgres array syntax: TEXT[]
        await sql`ALTER TABLE issues ADD COLUMN IF NOT EXISTS rejected_by TEXT[] DEFAULT '{}'`;
        console.log("Added 'rejected_by' column.");

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
