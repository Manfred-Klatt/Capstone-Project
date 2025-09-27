const express = require('express');
const authRoutes = require('./auth/auth.routes');
const userRoutes = require('./users/user.routes');
const gameRoutes = require('./game/game.routes');
const uploadRoutes = require('./upload/upload.routes');
const leaderboardRoutes = require('./leaderboard/leaderboard.routes');
const corsTestRoutes = require('./cors/cors.routes');

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
      health: '/api/v1/health',
      corsTest: '/api/v1/cors-test'
    },
    documentation: 'https://github.com/yourusername/animal-crossing-quiz#api-documentation'
  });
});

// API health check
router.get('/health', (req, res) => {
  // Get mongoose connection state
  const mongoose = require('mongoose');
  const connectionState = mongoose.connection.readyState;
  
  // Map mongoose connection state to readable status
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };
  
  // Calculate uptime
  const uptimeSeconds = process.uptime();
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus[connectionState] || 'unknown',
      state: connectionState
    },
    uptime: uptime,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Guest score submission endpoint (for backward compatibility)
const { submitGuestScore } = require('./leaderboard/leaderboard.controller');
const { allowWithGuestToken } = require('../../middleware/guestTokenMiddleware');
const { validateLeaderboardSubmission } = require('../../middleware/validation');

router.post('/submit-guest-score', 
  allowWithGuestToken('leaderboard'), 
  validateLeaderboardSubmission, 
  submitGuestScore
);

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/game', gameRoutes);
router.use('/upload', uploadRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/cors-test', corsTestRoutes);

module.exports = router;
