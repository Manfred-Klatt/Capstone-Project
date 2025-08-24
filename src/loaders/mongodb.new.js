const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

let isConnected = false;
let connectionRetryCount = 0;

// Configure Mongoose
mongoose.set('strictQuery', true);

// Debug logging for development
if (config.env === 'development') {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    logger.debug(`Mongoose: ${collectionName}.${method}`, { 
      collection: collectionName,
      method,
      query,
      doc 
    });
  });
}

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    reason: reason.message || reason,
    name: reason.name,
    stack: reason.stack,
    promise: promise
  });
});

/**
 * Establishes a connection to MongoDB with retry logic
 * @param {number} retryCount - Current retry attempt number
 * @returns {Promise<mongoose.Connection>} Mongoose connection instance
 */
const connectDB = async (retryCount = 0) => {
  if (isConnected && mongoose.connection.readyState === 1) {
    logger.info('Using existing database connection');
    return mongoose.connection;
  }

  const connectionUrl = process.env.MONGODB_URI || config.database?.url;
  
  // Sanitize URL for logging
  const logUrl = connectionUrl ? 
    connectionUrl.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/, '$1$2:*****@') : 
    'undefined';
    
  logger.info(`🔌 MongoDB Connection Attempt ${retryCount + 1}/${MAX_RETRIES}`, {
    url: logUrl,
    nodeEnv: process.env.NODE_ENV,
    appEnv: config.env
  });
  
  if (!connectionUrl) {
    const error = new Error('MongoDB connection URL is not defined. Please set MONGODB_URI in your environment variables.');
    logger.error('❌ Configuration Error', error.message);
    throw error;
  }

  try {
    // Parse connection URL for better error messages
    let url, dbName, authSource;
    try {
      url = new URL(connectionUrl);
      dbName = url.pathname.replace(/^\/+|\/+$/g, '') || 'acnh-quiz';
      authSource = url.searchParams.get('authSource') || 'admin';
      
      logger.info('🔍 Connection Details', {
        host: url.hostname,
        port: url.port || '27017',
        database: dbName,
        authSource,
        ssl: url.searchParams.get('ssl') === 'true' || url.searchParams.get('tls') === 'true'
      });
    } catch (parseError) {
      logger.warn('⚠️ Could not parse connection URL', {
        error: parseError.message,
        url: logUrl
      });
    }

    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
      ...(config.database?.options || {})
    };

    logger.debug('🔧 Connection Options', connectionOptions);
    
    // Close any existing connections to prevent memory leaks
    if (mongoose.connection.readyState !== 0) { // 0 = disconnected
      await mongoose.disconnect();
    }
    
    const conn = await mongoose.connect(connectionUrl, connectionOptions);
    
    isConnected = true;
    connectionRetryCount = 0;
    
    // Verify the connection by listing collections
    try {
      const collections = await conn.connection.db.listCollections().toArray();
      logger.info('✅ MongoDB Connected Successfully', {
        host: conn.connection.host,
        port: conn.connection.port,
        database: conn.connection.name,
        collections: collections.map(c => c.name),
        mongoVersion: conn.connection.version,
        driverVersion: conn.connection.getClient().serverInfo?.version || 'unknown'
      });
    } catch (listError) {
      logger.warn('⚠️ Connected but could not list collections', {
        error: listError.message,
        code: listError.code
      });
    }
    
    return conn.connection;
  } catch (error) {
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      connectionAttempt: `${retryCount + 1}/${MAX_RETRIES}`,
      url: logUrl,
      details: 'Connection failed'
    };
    
    // Add specific error handling for common issues
    if (error.name === 'MongoServerSelectionError') {
      errorInfo.details = 'Server selection failed. Check if MongoDB is running and accessible.';
      if (error.message.includes('getaddrinfo ENOTFOUND')) {
        errorInfo.details += ' DNS resolution failed - check your connection string hostname.';
      } else if (error.message.includes('timed out')) {
        errorInfo.details += ' Connection timed out. Check your network and firewall settings.';
      }
    } else if (error.name === 'MongoNetworkError') {
      errorInfo.details = 'Network error. Check your internet connection and MongoDB server status.';
    } else if (error.name === 'MongoError' && error.code === 18) {
      errorInfo.details = 'Authentication failed. Check your username and password.';
    } else if (error.name === 'MongoError' && error.code === 13) {
      errorInfo.details = 'Authorization failed. Check if the user has the correct permissions.';
    } else if (error.name === 'MongooseServerSelectionError') {
      errorInfo.details = 'Could not connect to any servers in your MongoDB Atlas cluster.';
    }
    
    logger.error('❌ MongoDB Connection Failed', errorInfo);
    
    // If we have retries left, schedule a retry
    if (retryCount < MAX_RETRIES - 1) {
      const nextRetry = retryCount + 1;
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
      logger.warn(`⏳ Retrying connection in ${delay}ms (${nextRetry + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectDB(nextRetry);
    }
    
    throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts: ${error.message}`);
  }
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  isConnected = true;
  connectionRetryCount = 0;
  logger.info('✅ MongoDB Connected');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  logger.error('❌ MongoDB Connection Error', {
    name: err.name,
    code: err.code,
    message: err.message,
    stack: err.stack
  });
  
  // Auto-reconnect if not already retrying
  if (connectionRetryCount < MAX_RETRIES) {
    const delay = RETRY_DELAY_MS * Math.pow(2, connectionRetryCount);
    logger.warn(`⏳ Will attempt to reconnect in ${delay}ms...`);
    
    setTimeout(() => {
      connectionRetryCount++;
      connectDB(connectionRetryCount).catch(e => {
        logger.error('Reconnection attempt failed:', e.message);
      });
    }, delay);
  } else {
    logger.error('Max reconnection attempts reached. Please check your database connection.');
  }
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('❌ MongoDB Disconnected');
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

module.exports = connectDB;
