const express = require('express');
const {
  submitScore,
  getLeaderboard,
  getAllLeaderboards,
  getUserStats,
  getUserHistory,
  resetAllLeaderboards
} = require('./leaderboard.controller');
const { protect, optionalAuth } = require('../../../../middleware/authMiddleware');
const { validateLeaderboardSubmission } = require('../../../../middleware/validation');
const { allowWithGuestToken } = require('../../../../middleware/guestTokenMiddleware');

const router = express.Router();

// Public routes with optional JWT auth + guest token fallback
router.get('/all', optionalAuth, allowWithGuestToken('leaderboard'), getAllLeaderboards);
router.get('/:category', optionalAuth, allowWithGuestToken('leaderboard'), getLeaderboard);

// Protected routes (require authentication)
router.use(protect);

router.post('/submit', validateLeaderboardSubmission, submitScore);
router.get('/user/stats', getUserStats);
router.get('/user/history/:category', getUserHistory);

// Admin-only route to reset all leaderboards
router.post('/reset-all', protect, (req, res, next) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Only administrators can reset leaderboards'
    });
  }
  next();
}, resetAllLeaderboards);

module.exports = router;
