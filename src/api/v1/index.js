const express = require('express');
const authRoutes = require('./auth/auth.routes');
const userRoutes = require('./users/user.routes');
const gameRoutes = require('./game/game.routes');
const uploadRoutes = require('./upload/upload.routes');

const router = express.Router();

// API v1 root endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Animal Crossing Quiz API v1',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        signup: '/api/v1/auth/signup',
        login: '/api/v1/auth/login',
        forgotPassword: '/api/v1/auth/forgot-password',
        resetPassword: '/api/v1/auth/reset-password/:token',
        updatePassword: '/api/v1/auth/update-password',
        me: '/api/v1/auth/me'
      },
      users: '/api/v1/users',
      games: '/api/v1/games',
      upload: '/api/v1/upload',
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
