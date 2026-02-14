const sql = require('../db');
const { sendEmail } = require('../utils/emailService');
const { translateText } = require('./translationService');
const admin = require('firebase-admin');

// Initialize Firebase
try {
    if (!admin.apps.length) {
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault()
            });
            console.log("🔥 Firebase Admin Initialized");
        } else {
            // Mock or soft fail
            console.log("⚠️ Firebase credentials not found. Notifications will default to EMAIL.");
        }
    }
} catch (e) {
    console.error("Firebase init failed:", e.message);
}

/**
 * Sends a notification via FCM or Email (Fallback)
 * @param {string} userId - UUID of the user
 * @param {string} title - Notification Title
 * @param {string} body - Notification Body
 * @param {object} data - Optional data payload
 */
const sendNotification = async (userId, title, body, data = {}) => {
    try {
        // 1. Fetch User Details (FCM Token, Email, Preferences)
        const userResult = await sql`
            SELECT email, fcm_token, notifications_enabled, preferred_language 
            FROM users WHERE id = ${userId}
        `;

        if (userResult.length === 0) return;
        const { email, fcm_token, notifications_enabled, preferred_language } = userResult[0];

        // Translate Title & Body if not English
        // Default to English if translation fails or checks
        let finalTitle = title;
        let finalBody = body;

        const lang = preferred_language || 'en';
        if (lang !== 'en') {
            try {
                // Parallel translation
                const [tTitle, tBody] = await Promise.all([
                    translateText(title),
                    translateText(body)
                ]);
                finalTitle = tTitle[lang] || title;
                finalBody = tBody[lang] || body;
            } catch (transErr) {
                console.warn("Notification translation failed, invalid input/output:", transErr.message);
                // Fallback to English/Original
            }
        }

        // 2. Log Action (Pending)
        const log = await sql`
            INSERT INTO notification_logs (user_id, type, title, body, status)
            VALUES (${userId}, 'TBD', ${title}, ${body}, 'pending')
            RETURNING id
        `;
        const logId = log[0].id;

        let sentViaFCM = false;

        // 3. Try FCM if token exists and enabled
        if (notifications_enabled && fcm_token && admin.apps.length) {
            const message = {
                notification: { title: finalTitle, body: finalBody },
                data: { ...data, timestamp: new Date().toISOString() },
                token: fcm_token
            };

            try {
                await admin.messaging().send(message);
                console.log(`[FCM] Sent to ${email}`);
                sentViaFCM = true;
            } catch (fcmErr) {
                console.error("[FCM Error]:", fcmErr.message);
                if (fcmErr.code === 'messaging/registration-token-not-registered') {
                    // Cleanup invalid token
                    await sql`UPDATE users SET fcm_token = NULL WHERE id = ${userId}`;
                }
            }
        }

        // 4. Fallback to Email
        const finalType = sentViaFCM ? 'push' : 'email';

        if (!sentViaFCM) {
            console.log(`[Email] Sending fallback to ${email}`);
            await sendEmail(email, finalTitle, `${finalBody}\n\n(Access your dashboard for details)`);
        }

        // Update Log
        await sql`
            UPDATE notification_logs 
            SET type = ${finalType}, status = 'sent' 
            WHERE id = ${logId}
        `;

    } catch (err) {
        console.error("Notification System Error:", err);
    }
};

module.exports = { sendNotification };
