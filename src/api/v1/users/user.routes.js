const express = require('express');
const userController = require('./user.controller');
const authMiddleware = require('../../../middleware/auth');
const { catchAsync } = require('../../../utils');

const router = express.Router();

// Protect all routes after this middleware
router.use(authMiddleware.protect);

// Get current user
router.get('/me', userController.getMe);

// Update user profile
router.patch('/me', catchAsync(userController.updateUser));

// Update user avatar
router.patch(
  '/me/avatar',
  upload.single('avatar'),
  catchAsync(userController.updateUserAvatar)
);

// Get user stats
router.get('/me/stats', catchAsync(userController.getUserStats));

// Get user game history
router.get('/me/games', catchAsync(userController.getUserGameHistory));

// Admin routes
router.use(authMiddleware.restrictTo('admin'));

// Get all users
router.get('/', catchAsync(userController.getAllUsers));

// Get user by ID
router.get('/:id', catchAsync(userController.getUser));

// Update user by ID
router.patch('/:id', catchAsync(userController.updateUser));

// Delete user (mark as inactive)
router.delete('/:id', catchAsync(userController.deleteUser));

module.exports = router;
