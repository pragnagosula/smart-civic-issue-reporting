require('dotenv').config();
const sql = require('./db');

const migrateNotifications = async () => {
    try {
        console.log('--- Migrating Database for Notifications & Feedback ---');

        // 1. Add FCM Token to Users
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT`;
        console.log("✅ Added 'fcm_token' to users table.");

        // 2. Add Notifications Settings (Optional but good for 'enabled' check)
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE`;
        console.log("✅ Added 'notifications_enabled' to users table.");

        // 3. Create Notification Logs (Audit Trail)
        await sql`
            CREATE TABLE IF NOT EXISTS notification_logs (
                id SERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id),
                type VARCHAR(50), -- 'email', 'push'
                title VARCHAR(255),
                body TEXT,
                status VARCHAR(20), -- 'sent', 'failed'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log("✅ Created 'notification_logs' table.");

        // 4. Create Issue Feedback Table
        await sql`
            CREATE TABLE IF NOT EXISTS issue_feedback (
                id SERIAL PRIMARY KEY,
                issue_id INTEGER REFERENCES issues(id),
                citizen_id UUID REFERENCES users(id),
                response VARCHAR(20) CHECK (response IN ('Resolved', 'Not Resolved')),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(issue_id, citizen_id) -- ONE feedback per user per issue
            )
        `;
        console.log("✅ Created 'issue_feedback' table.");

        console.log('--- Migration Complete ---');
        process.exit(0);

    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
};

migrateNotifications();
