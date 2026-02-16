const express = require('express');
const router = express.Router();
const officerController = require('../controllers/officerController');
const authMiddleware = require('../middleware/authMiddleware');

// ============================
// OFFICER ROUTES (All Protected)
// ============================

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all issues for officer's department
router.get('/my-department-issues', officerController.getDepartmentIssues);

// Update issue status (In Progress, Resolved, Rejected)
router.patch('/issue/:id/status', officerController.updateIssueStatus);

module.exports = router;