const http = require('http');
const config = require('./config');
const connectDB = require('./loaders/mongodb');
const createApp = require('./loaders/express');
const logger = require('./utils/logger');

// Create Express app
const app = createApp();

// Create HTTP server
const server = http.createServer(app);


// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
    reason: reason.message || reason,
    stack: reason.stack
  });
  
  // Close server & exit process
  server.close(() => {
    logger.error('💥 Process terminated due to unhandled rejection!');
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
    error: err.message,
    stack: err.stack
  });
  
  // Close server & exit process
  server.close(() => {
    logger.error('💥 Process terminated due to uncaught exception!');
    process.exit(1);
  });
});

// Handle SIGTERM (for Heroku)
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('💥 Process terminated gracefully');
    process.exit(0);
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Determine port - Railway provides PORT environment variable
    const port = process.env.PORT || config.port;
    
    // Log environment details
    console.log('Starting server with environment:', {
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY_ENVIRONMENT_NAME: process.env.RAILWAY_ENVIRONMENT_NAME || 'not-on-railway',
      PORT: port,
      configPort: config.port,
      configEnv: config.env
    });
    
    // Start listening
    server.listen(port, '0.0.0.0', () => {
      console.log(`Server running in ${config.env} mode on port ${port}`);
      console.log(`MongoDB connection string: ${process.env.MONGODB_URI ? 'is set' : 'is NOT set'}`);
      console.log(`CORS origin: ${process.env.CORS_ORIGIN || config.cors?.origin || 'not explicitly set'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Start the server
if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { app, server };
