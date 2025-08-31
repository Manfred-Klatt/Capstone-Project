/**
 * CORS Test Routes
 */

const express = require('express');
const corsController = require('./cors.controller');
const { exemptFromCSRF } = require('../../../middleware/csrfMiddleware');

const router = express.Router();

// Apply CSRF exemption to these test routes
router.use(exemptFromCSRF);

// Test endpoints
router.get('/test-guest-token', corsController.testGuestToken);
router.get('/test-preflight', corsController.testPreflight);
router.get('/test-csrf', corsController.testCSRF);

module.exports = router;
