require('dotenv').config();
const sql = require('./db');

const addSLATrackingColumns = async () => {
    try {
        console.log("Adding SLA Tracking columns to issues table...");
        await sql`ALTER TABLE issues ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP`;
        await sql`ALTER TABLE issues ADD COLUMN IF NOT EXISTS in_progress_at TIMESTAMP`;
        console.log("Columns added successfully!");
    } catch (err) {
        console.error("Error adding columns:", err.message);
    } finally {
        process.exit();
    }
};

addSLATrackingColumns();
