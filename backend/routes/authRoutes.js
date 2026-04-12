const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const officerController = require('../controllers/officerController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'officer-doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only PDF, JPG, and PNG files are allowed!'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// Import auth middleware
const authMiddleware = require('../middleware/authMiddleware');

// ============================
// PUBLIC ROUTES (No Auth)
// ============================

// Citizen Authentication
router.post('/signup', authController.signup);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/login', authController.login);
router.post('/login-verify', authController.loginVerify);

// Admin Authentication
router.post('/admin-login', authController.adminLogin);

// Officer Registration (Public - but will be pending approval)
router.post('/officer-register', upload.single('document'), officerController.registerOfficer);

// ============================
// PROTECTED ROUTES (Auth Required)
// ============================

// FCM Token Update
router.post('/fcm-token', authMiddleware, authController.updateFcmToken);

// Language Update
router.post('/update-language', authMiddleware, authController.updateLanguage);

module.exports = router;