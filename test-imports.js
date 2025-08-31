// Test script to verify import paths
console.log('Starting import test...');

try {
  // Test auth controller imports
  console.log('Testing auth controller imports...');
  const authService = require('./src/services/auth.service');
  const authUtils = require('./src/utils');
  const authLogger = require('./src/utils/logger');
  const User = require('./src/models/User');
  console.log('✓ Auth controller imports successful');

  // Test leaderboard controller imports
  console.log('Testing leaderboard controller imports...');
  const Leaderboard = require('./src/models/Leaderboard');
  const leaderboardUser = require('./src/models/User');
  const catchAsync = require('./src/utils/catchAsync');
  const AppError = require('./src/utils/appError');
  const { successResponse } = require('./src/utils/response');
  console.log('✓ Leaderboard controller imports successful');

  // Test game controller imports
  console.log('Testing game controller imports...');
  const gameService = require('./src/services/game.service');
  const userService = require('./src/services/user.service');
  const gameUtils = require('./src/utils');
  console.log('✓ Game controller imports successful');

  // Test middleware imports
  console.log('Testing middleware imports...');
  const guestTokenMiddleware = require('./middleware/guestTokenMiddleware');
  const authMiddleware = require('./middleware/auth');
  const csrfMiddleware = require('./middleware/csrfMiddleware');
  console.log('✓ Middleware imports successful');

  console.log('All imports tested successfully!');
} catch (error) {
  console.error('Import test failed:', error.message);
  console.error(error.stack);
}
