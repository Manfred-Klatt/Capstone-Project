const express = require('express');
const gameController = require('./game.controller');
const authMiddleware = require('../../../middleware/auth');
const { catchAsync } = require('../../../utils');

const router = express.Router();

// Public routes
router.get('/categories', catchAsync(gameController.getCategories));
router.get('/leaderboard', catchAsync(gameController.getLeaderboard));
router.get('/users/:userId/history', catchAsync(gameController.getUserGameHistory));
router.get('/users/:userId/stats', catchAsync(gameController.getUserStats));

// Protected routes (require authentication)
router.use(authMiddleware.protect);

// Game management
router.post('/start', catchAsync(gameController.startGame));
router.post('/:gameId/submit', catchAsync(gameController.submitGame));
router.get('/:gameId/results', catchAsync(gameController.getGameResults));

// User's own game history and stats (no user ID needed)
router.get('/me/history', catchAsync(gameController.getUserGameHistory));
router.get('/me/stats', catchAsync(gameController.getUserStats));

module.exports = router;
