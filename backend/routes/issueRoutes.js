const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/report', authMiddleware, issueController.reportIssue);
router.post('/:id/comment', authMiddleware, issueController.addComment);
router.post('/:id/like', authMiddleware, issueController.toggleLike);
router.delete('/:issueId/comment/:commentId', authMiddleware, issueController.deleteComment);
router.get('/all', authMiddleware, issueController.getAllIssues);
router.get('/my-issues', authMiddleware, issueController.getMyIssues);
router.get('/:id', authMiddleware, issueController.getIssueDetails);
router.post('/assign/:id', authMiddleware, issueController.assignIssue);

module.exports = router;
