const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const verifyToken = require('../middleware/authMiddleware');
const verifyRole = require('../middleware/roleMiddleware');

// 1. Officer Profile (Officer access)
router.get('/officer/profile', verifyToken, verifyRole(['officer', 'admin']), analyticsController.getOfficerProfile);

// 2. Department Analytics (Admin access)
router.get('/admin/department-analytics', verifyToken, verifyRole(['admin']), analyticsController.getDepartmentAnalytics);

// 3. Civic Health (Admin access)
router.get('/admin/civic-health', verifyToken, verifyRole(['admin']), analyticsController.getCivicHealth);

// 4. Citizen Profile (Citizen access)
router.get('/citizen/profile', verifyToken, analyticsController.getCitizenProfile);

module.exports = router;
