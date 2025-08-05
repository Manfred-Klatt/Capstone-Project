const express = require('express');
const authController = require('./auth.controller');
const authMiddleware = require('../../../middleware/auth');
const { catchAsync } = require('../../../utils');

const router = express.Router();

// Public routes
router.post('/signup', catchAsync(authController.signup));
router.post('/login', catchAsync(authController.login));
router.post('/forgot-password', catchAsync(authController.forgotPassword));
router.patch('/reset-password/:token', catchAsync(authController.resetPassword));
router.post('/reactivate-account', catchAsync(authController.reactivateAccount));

// Protected routes (require authentication)
router.use(authMiddleware.protect);

router.patch('/update-password', catchAsync(authController.updatePassword));
router.get('/me', authController.getMe, catchAsync(authController.getUser));

module.exports = router;
