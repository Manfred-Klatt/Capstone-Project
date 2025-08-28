const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// MongoDB connection check
router.get('/db', async (req, res) => {
  try {
    // Check if mongoose is connected
    const state = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    if (state === 1) {
      // If connected, try a simple operation to verify full functionality
      const dbInfo = {
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        models: Object.keys(mongoose.models)
      };

      res.status(200).json({
        status: 'success',
        connection: stateMap[state],
        dbInfo,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'error',
        connection: stateMap[state],
        message: 'Database not fully connected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Health check DB error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
