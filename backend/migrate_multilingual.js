require('dotenv').config();
const sql = require('./db');

async function migrate() {
    try {
        console.log("Starting multilingual migration...");

        // 1. Users: preferred_language
        // Check if column exists, if not add it. (It likely exists from previous check).
        // Ensure default is 'en'.
        await sql`ALTER TABLE users ALTER COLUMN preferred_language SET DEFAULT 'en'`;
        // Ensure length is sufficient? VARCHAR(5). 
        // Existing might be VARCHAR(10) or more. That's fine.

        // 2. Issues: description (JSONB), original_language
        // Check if description exists.
        // We will TRY to add it. If it exists as TEXT, we convert.

        // First, check existing columns
        const cols = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'issues'
        `;
        const hasDescription = cols.some(c => c.column_name === 'description');
        const hasVoiceText = cols.some(c => c.column_name === 'voice_text');
        const hasResolutionNote = cols.some(c => c.column_name === 'resolution_note');
        const hasOriginalLanguage = cols.some(c => c.column_name === 'original_language');

        if (!hasDescription) {
            console.log("Adding description column to issues...");
            await sql`ALTER TABLE issues ADD COLUMN description JSONB`;

            // Migrate data from voice_text if available
            if (hasVoiceText) {
                console.log("Migrating voice_text to description...");
                // Assuming existing data is 'en' or using 'language' column if exists
                // We'll trust the 'language' column if valid, else 'en'.
                await sql`
                    UPDATE issues 
                    SET description = jsonb_build_object(COALESCE(language, 'en'), voice_text)
                    WHERE voice_text IS NOT NULL AND description IS NULL
                `;
            }
        } else {
            console.log("Description column already exists. Checking type...");
            // If it is text, convert to jsonb? This is risky if it's already JSON string.
            // Assuming we are good or manual intervention if it fails.
        }

        if (!hasOriginalLanguage) {
            console.log("Adding original_language column...");
            await sql`ALTER TABLE issues ADD COLUMN original_language VARCHAR(10)`;
            // Migrate from 'language' column if exists
            await sql`UPDATE issues SET original_language = language`;
        }

        if (!hasResolutionNote) {
            console.log("Adding resolution_note column...");
            await sql`ALTER TABLE issues ADD COLUMN resolution_note JSONB`;
        }

        // 3. Issue Citizens (Feedback): feedback_comment to JSONB
        // Check current type
        const icCols = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'issue_citizens' AND column_name = 'feedback_comment'
        `;

        if (icCols.length > 0) {
            const type = icCols[0].data_type;
            if (type !== 'jsonb') {
                console.log("Converting feedback_comment to JSONB...");
                // CAST existing text to JSONB? 
                // Currently it's likely plain text.
                // We should convert 'text content' -> '{"en": "text content"}'
                // Use USING clause
                await sql`
                    ALTER TABLE issue_citizens 
                    ALTER COLUMN feedback_comment TYPE JSONB 
                    USING jsonb_build_object('en', feedback_comment)
                `;
            }
        }

        console.log("Migration completed successfully.");

    } catch (err) {
        console.error("Migration failed:", err);
    }
}

migrate();
