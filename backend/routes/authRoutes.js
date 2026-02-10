const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const officerController = require('../controllers/officerController');
const multer = require('multer');
const path = require('path');

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.post('/signup', authController.signup);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/login', authController.login);
router.post('/login-verify', authController.loginVerify);
router.post('/admin-login', authController.adminLogin);

const authMiddleware = require('../middleware/authMiddleware');

// Officer Routes
router.post('/officer-register', upload.single('document'), officerController.registerOfficer);
router.post('/fcm-token', authMiddleware, authController.updateFcmToken);

module.exports = router;
