const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD, // Updated to match .env
    },
});

// Debug: Check if credentials are loaded
if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.warn("WARNING: Email credentials are MISING in .env file!");
    console.warn("EMAIL_USER present:", !!process.env.EMAIL_USER);
    console.warn("EMAIL_APP_PASSWORD present:", !!process.env.EMAIL_APP_PASSWORD);
}

const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
        return true;
    } catch (error) {
        console.error('Error sending generic email:', error.message);
        return false;
    }
};

const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Login OTP',
        text: `Your OTP for verification is: ${otp}. It expires in 10 minutes.`,
    };

    try {
        // Log OTP in console for development
        console.log(`\n=== DEV OTP for ${email}: ${otp} ===\n`);

        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error.message);
        console.log('Assuming Dev Mode: Allowing OTP verification anyway.');
        return true; // Use true to bypass email failure in dev
    }
};

module.exports = { sendOTP, sendEmail };
