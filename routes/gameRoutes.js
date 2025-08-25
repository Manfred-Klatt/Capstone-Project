const express = require('express');
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/leaderboard', gameController.getLeaderboard);
router.get('/leaderboard/:category', gameController.getLeaderboard);
router.get('/categories', gameController.getCategories);
router.post('/submit-guest-score', gameController.submitGuestScore);

// Protected routes
router.use(authMiddleware.protect);

// Game session routes
router.post('/start', gameController.startGame);
router.post('/submit-answer', gameController.submitAnswer);
router.post('/end-game', gameController.endGame);
router.get('/highscores', gameController.getUserHighscores);

module.exports = router;
