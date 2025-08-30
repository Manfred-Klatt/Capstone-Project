const mongoose = require('mongoose');
const config = require('.');

/**
 * Connect to MongoDB with proper error handling and database name
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
const connectDB = async () => {
  try {
    // Get connection URL from environment variables or config
    let connectionUrl = process.env.MONGODB_URI || config.database.url;
    
    if (!connectionUrl) {
      throw new Error('MongoDB connection URL is not defined in environment variables or config');
    }
    
    // Ensure database name is included in the connection string
    const DATABASE_NAME = 'acnh-quiz';
    
    // Handle different URL formats to ensure database name is included
    if (connectionUrl.includes('mongodb+srv://')) {
      // MongoDB Atlas URL
      if (!connectionUrl.includes(`/${DATABASE_NAME}?`) && !connectionUrl.includes(`/${DATABASE_NAME}/`)) {
        // Add database name before query parameters
        if (connectionUrl.includes('?')) {
          connectionUrl = connectionUrl.replace('?', `/${DATABASE_NAME}?`);
        } else {
          connectionUrl = `${connectionUrl}/${DATABASE_NAME}`;
        }
      }
    } else if (!connectionUrl.includes(`/${DATABASE_NAME}`)) {
      // Standard MongoDB URL without database name
      connectionUrl += `/${DATABASE_NAME}`;
    }
    
    console.log(`MongoDB connection URL (sanitized): ${connectionUrl.replace(/(\/\/[^:]+:)[^@]+(@)/, '$1*****$2')}`);
    
    
    // Connection options - no need for deprecated options in mongoose 6+
    const options = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000
    };
    
    // Connect with proper options
    const conn = await mongoose.connect(connectionUrl, options);
    console.log(`MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('Error details:', {
      name: err.name,
      code: err.code || 'N/A'
    });
    
    // Don't exit process in production, allow for retry
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw err;
  }
};

module.exports = connectDB;
