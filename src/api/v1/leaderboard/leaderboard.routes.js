const express = require('express');
const {
  submitScore,
  getLeaderboard,
  getAllLeaderboards,
  getUserStats,
  getUserHistory
} = require('./leaderboard.controller');
const { protect } = require('../../../middleware/auth');
const { validateLeaderboardSubmission } = require('../../../middleware/validation');
const { allowWithGuestToken } = require('../../../middleware/guestTokenMiddleware');

const router = express.Router();

// Public routes with guest token authentication option
router.get('/all', allowWithGuestToken('leaderboard'), getAllLeaderboards);
router.get('/:category', allowWithGuestToken('leaderboard'), getLeaderboard);

// Protected routes (require authentication)
router.use(protect);

router.post('/submit', validateLeaderboardSubmission, submitScore);
router.get('/user/stats', getUserStats);
router.get('/user/history/:category', getUserHistory);

module.exports = router;
