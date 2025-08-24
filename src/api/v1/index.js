const express = require('express');
const authRoutes = require('./auth/auth.routes');
const userRoutes = require('./users/user.routes');
const gameRoutes = require('./game/game.routes');
const uploadRoutes = require('./upload/upload.routes');
const leaderboardRoutes = require('./leaderboard/leaderboard.routes');

const router = express.Router();

// API v1 root endpoint
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to Animal Crossing Quiz API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      game: '/api/v1/game',
      upload: '/api/v1/upload',
      leaderboard: '/api/v1/leaderboard',
      health: '/api/v1/health'
    },
    documentation: 'https://github.com/yourusername/animal-crossing-quiz#api-documentation'
  });
});

// API health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/games', gameRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
