const mongoose = require('mongoose');
const config = require('.');

/**
 * Connect to MongoDB with proper error handling and database name
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
const connectDB = async () => {
  try {
    // Ensure database name is included in the connection string
    let connectionUrl = config.database.url;
    
    // If URL doesn't contain a database name, add 'acnh-quiz'
    if (connectionUrl && !connectionUrl.includes('mongodb+srv://') && !connectionUrl.includes('/')) {
      connectionUrl += '/acnh-quiz';
    } else if (connectionUrl && connectionUrl.includes('mongodb+srv://') && 
               !connectionUrl.includes('/?') && !connectionUrl.includes('/' + 'acnh-quiz')) {
      // For MongoDB Atlas URLs, add database name before query parameters
      connectionUrl = connectionUrl.replace('/?', '/acnh-quiz?');
      if (!connectionUrl.includes('/?')) {
        connectionUrl = connectionUrl.replace('?', '/acnh-quiz?');
      }
    }
    
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
