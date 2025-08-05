const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

let isConnected = false;
let connectionRetryCount = 0;

// Enable debug logging for Mongoose in development
if (config.env === 'development') {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    logger.debug(`Mongoose: ${collectionName}.${method}`, { query, doc });
  });
}

// Handle deprecation warnings
mongoose.set('strictQuery', true);

// Enable debug logging for Mongoose
mongoose.set('debug', (collectionName, method, query, doc) => {
  logger.debug(`Mongoose: ${collectionName}.${method}`, { query, doc });
});

// Handle deprecation warnings
mongoose.set('strictQuery', true);

// Add global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { 
    promise, 
    reason: reason.message || reason,
    stack: reason.stack 
  });
  // Consider implementing a more robust error handling strategy
});

const connectDB = async (retryCount = 0) => {
  if (isConnected) {
    logger.info('Using existing database connection');
    return;
  }

  const connectionUrl = process.env.MONGODB_URI || config.database.url;
  
  logger.info(`Attempting to connect to MongoDB (Attempt ${retryCount + 1}/${MAX_RETRIES})`, {
    url: connectionUrl ? connectionUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : 'undefined',
    options: config.database.options
  });
  
  if (!connectionUrl) {
    throw new Error('MongoDB connection URL is not defined. Please set MONGODB_URI in your .env file.');
  }

  try {
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout for server selection
      socketTimeoutMS: 45000, // 45 seconds timeout for socket operations
      connectTimeoutMS: 10000, // 10 seconds timeout for initial connection
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
      ...config.database.options // Allow config to override defaults
    };

    logger.debug('Mongoose connection options:', connectionOptions);
    
    try {
      const conn = await mongoose.connect(connectionUrl, connectionOptions);
      
      isConnected = true;
      connectionRetryCount = 0; // Reset retry count on successful connection
      
      const collections = await conn.connection.db.listCollections().toArray();
      
      logger.info('✅ MongoDB Connected Successfully!', {
        host: conn.connection.host,
        port: conn.connection.port,
        database: conn.connection.name,
        collections: collections.map(c => c.name)
      });
      
      return conn;
    } catch (error) {
      logger.error('❌ MongoDB connection failed:', {
        error: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      });
      throw error;
    }
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      isConnected = true;
      logger.info('🔌 Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', {
        error: err.message,
        code: err.code,
        name: err.name,
        stack: err.stack
      });
      
      isConnected = false;
      
      // Only attempt to reconnect if we're not already in a reconnection attempt
      if (connectionRetryCount < MAX_RETRIES) {
        const nextRetry = connectionRetryCount + 1;
        const delay = RETRY_DELAY_MS * Math.pow(2, nextRetry); // Exponential backoff
        
        logger.warn(`Attempting to reconnect to MongoDB (${nextRetry}/${MAX_RETRIES}) in ${delay/1000} seconds...`);
        
        setTimeout(() => {
          logger.info(`Reconnecting to MongoDB (Attempt ${nextRetry + 1}/${MAX_RETRIES})...`);
          connectDB(nextRetry).catch(err => {
            logger.error('Reconnection attempt failed:', err);
          });
        }, delay);
      } else {
        logger.error('Max retry attempts reached. Please check your MongoDB connection.');
        // Consider implementing a more robust error handling strategy here
      }
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('❌ Mongoose disconnected from DB');
      isConnected = false;
      
      // Only attempt to reconnect if we're not already in a reconnection attempt
      if (connectionRetryCount < MAX_RETRIES) {
        const nextRetry = connectionRetryCount + 1;
        const delay = RETRY_DELAY_MS * Math.pow(2, nextRetry); // Exponential backoff
        
        logger.warn(`Attempting to reconnect to MongoDB (${nextRetry}/${MAX_RETRIES}) in ${delay/1000} seconds...`);
        
        setTimeout(() => {
          logger.info(`Reconnecting to MongoDB (Attempt ${nextRetry + 1}/${MAX_RETRIES})...`);
          connectDB(nextRetry).catch(err => {
            logger.error('Reconnection attempt failed:', err);
          });
        }, delay);
      }
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔁 Mongoose reconnected to DB');
      isConnected = true;
      connectionRetryCount = 0; // Reset retry count on successful reconnection
    });

    // Close the Mongoose connection when the Node process ends
    process.on('SIGINT', async () => {
      try {
        logger.info('Closing MongoDB connection...');
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error closing MongoDB connection:', {
          error: err.message,
          stack: err.stack
        });
        process.exit(1);
      }
    });
  } catch (err) {
    isConnected = false;
    const nextRetryCount = retryCount + 1;
    
    if (nextRetryCount < MAX_RETRIES) {
      logger.warn(`MongoDB connection failed (Attempt ${nextRetryCount}/${MAX_RETRIES}):`, {
        error: err.message,
        stack: err.stack
      });
      
      logger.info(`Retrying connection in ${RETRY_DELAY_MS / 1000} seconds...`);
      
      // Use setTimeout with a promise to wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(nextRetryCount);
    }
    
    // If we've exhausted all retries, log the error and throw
    logger.error('❌ Max retries reached. Could not connect to MongoDB.', {
      error: err.message,
      stack: err.stack,
      url: connectionUrl,
      options: config.database.options
    });
    
    // Throw a more descriptive error
    const error = new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
    error.originalError = err;
    error.connectionDetails = { url: connectionUrl, options: config.database.options };
    throw error;
  }
};

module.exports = connectDB;
