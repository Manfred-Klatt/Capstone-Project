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

const router = express.Router();

// Public routes
router.get('/all', getAllLeaderboards);
router.get('/:category', getLeaderboard);

// Protected routes (require authentication)
router.use(protect);

router.post('/submit', validateLeaderboardSubmission, submitScore);
router.get('/user/stats', getUserStats);
router.get('/user/history/:category', getUserHistory);

module.exports = router;
