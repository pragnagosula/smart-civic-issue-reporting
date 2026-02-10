const sql = require('../db');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const { sendOTP } = require('../utils/emailService');

const generateToken = (id, email, role, language, department) => {
    return jwt.sign({ id, email, role, language, department }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// 1. Citizen Signup
exports.signup = async (req, res) => {
    const { name, email, phone, preferred_language } = req.body;

    try {
        // Check if user exists
        const userCheck = await sql`SELECT * FROM users WHERE email = ${email} OR phone = ${phone}`;
        if (userCheck.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = await sql`
            INSERT INTO users (name, email, phone, role, preferred_language, is_verified) 
            VALUES (${name}, ${email}, ${phone}, 'citizen', ${preferred_language || 'en'}, false) 
            RETURNING *
        `;

        res.status(201).json({ message: 'User registered successfully', user: newUser[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 2. Send OTP
exports.sendOtp = async (req, res) => {
    const { email } = req.body;

    try {
        const userResult = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await sql`UPDATE users SET otp = ${otp}, otp_expiry = ${otpExpiry} WHERE email = ${email}`;

        const emailSent = await sendOTP(email, otp);
        if (emailSent) {
            res.json({ message: 'OTP sent successfully' });
        } else {
            res.status(500).json({ message: 'Failed to send OTP' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 3. Verify OTP (For initial verification or login)
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const result = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (result.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result[0];

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (new Date() > new Date(user.otp_expiry)) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        // OTP Valid
        await sql`UPDATE users SET is_verified = true, otp = NULL, otp_expiry = NULL WHERE email = ${email}`;

        res.json({ message: 'OTP Verified successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 4. Login (Initiate)
exports.login = async (req, res) => {
    const { email } = req.body;

    try {
        const userResult = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found. Please signup.' });
        }

        // Generate and send OTP
        const otp = otpGenerator.generate(6, { digits: true, upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await sql`UPDATE users SET otp = ${otp}, otp_expiry = ${otpExpiry} WHERE email = ${email}`;

        const emailSent = await sendOTP(email, otp);
        if (emailSent) {
            res.json({ message: 'OTP sent to email' });
        } else {
            res.status(500).json({ message: 'Failed to send OTP' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 5. Login Verify -> Issue Token
exports.loginVerify = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const result = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (result.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result[0];

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (new Date() > new Date(user.otp_expiry)) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        if (!user.is_verified) {
            await sql`UPDATE users SET is_verified = true WHERE email = ${email}`;
        }

        // Clear OTP
        await sql`UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = ${user.id}`;


        const token = generateToken(user.id, user.email, user.role, user.preferred_language, user.department);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                preferred_language: user.preferred_language
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// 6. Admin Login (Password based)
exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log("Admin Login Attempt:", { email });

        // 1. Check strict credentials against env
        if (email !== process.env.ADMIN_EMAIL) {
            console.log("Admin Login Failed: Email mismatch. Expected:", process.env.ADMIN_EMAIL, "Got:", email);
            return res.status(401).json({ message: "Invalid admin email" });
        }

        if (password !== process.env.ADMIN_SECRET) {
            console.log("Admin Login Failed: Password mismatch.");
            return res.status(401).json({ message: "Invalid admin secret" });
        }

        // 2. Check if admin user exists in DB to get ID
        const userResult = await sql`SELECT * FROM users WHERE email = ${email}`;

        let adminUser;
        if (userResult.length === 0) {
            return res.status(404).json({ message: "Admin user record not found in database." });
        } else {
            adminUser = userResult[0];
            if (adminUser.role !== 'admin') {
                return res.status(403).json({ message: "User exists but is not an admin." });
            }
        }

        // 3. Generate Token
        const token = generateToken(adminUser.id, adminUser.email, 'admin', 'en', null);

        res.json({
            message: 'Admin login successful',
            token,
            user: {
                id: adminUser.id,
                name: adminUser.name,
                email: adminUser.email,
                role: 'admin',
                preferred_language: 'en'
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error during admin login" });
    }
};

exports.updateFcmToken = async (req, res) => {
    try {
        const { fcm_token } = req.body;
        await sql`UPDATE users SET fcm_token = ${fcm_token} WHERE id = ${req.user.id}`;
        res.json({ message: 'FCM Token updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
