const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Reactivation route (public, no authentication required)
router.post('/reactivate-account', authController.reactivateAccount);

// Protected routes (require authentication)
const protectedRouter = express.Router();
protectedRouter.use(authMiddleware.protect);

// Add protected routes here
protectedRouter.post('/update-password', authMiddleware.updatePassword);

// Mount the protected router
router.use(protectedRouter);

module.exports = router;
