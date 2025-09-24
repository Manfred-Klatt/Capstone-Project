/**
 * Health Check Route
 * 
 * This route provides a simple health check endpoint for monitoring
 * and for Railway's health check system.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/**
 * @route   GET /api/v1/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      name: mongoose.connection.name || 'unknown'
    },
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
    }
  };

  res.status(200).json(healthcheck);
});

module.exports = router;
