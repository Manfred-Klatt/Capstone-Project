/**
 * Test Railway MongoDB Connection
 * 
 * This script tests the connection to the Railway MongoDB database.
 * It will attempt to connect, list collections, and perform basic operations.
 * 
 * Usage:
 * node testRailwayMongoConnection.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');

async function testConnection() {
  try {
    console.log('Testing connection to MongoDB...');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not set!');
      console.log('Please make sure you have set up the MongoDB connection in Railway.');
      process.exit(1);
    }
    
    // Sanitize connection string for logging
    const sanitizedUri = process.env.MONGODB_URI.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/, '$1$2:****@');
    console.log('Connection string (sanitized):', sanitizedUri);
    
    // Connect to MongoDB
    const conn = await connectDB();
    
    console.log('\n✅ Successfully connected to MongoDB!');
    console.log(`Database name: ${conn.connection.name}`);
    console.log(`Host: ${conn.connection.host}`);
    console.log(`MongoDB version: ${conn.connection.client.serverInfo?.version || 'unknown'}`);
    
    // List collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('\nCollections in database:');
    if (collections.length === 0) {
      console.log('No collections found. Database is empty.');
    } else {
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }
    
    // Test a simple operation
    console.log('\nTesting database operations...');
    
    // Create a temporary collection for testing
    const testCollection = 'railway_connection_test';
    
    // Check if test collection exists and drop it if it does
    const collectionExists = collections.some(c => c.name === testCollection);
    if (collectionExists) {
      console.log(`Dropping existing test collection: ${testCollection}`);
      await conn.connection.db.dropCollection(testCollection);
    }
    
    // Create test collection
    console.log(`Creating test collection: ${testCollection}`);
    await conn.connection.db.createCollection(testCollection);
    
    // Insert a test document
    console.log('Inserting test document...');
    const result = await conn.connection.db.collection(testCollection).insertOne({
      test: true,
      createdAt: new Date(),
      message: 'Railway MongoDB connection test successful!'
    });
    
    console.log('Document inserted:', result.acknowledged ? 'Success' : 'Failed');
    
    // Find the document
    console.log('Reading test document...');
    const doc = await conn.connection.db.collection(testCollection).findOne({ test: true });
    console.log('Document found:', doc ? 'Success' : 'Not found');
    
    // Clean up - drop the test collection
    console.log('Cleaning up - dropping test collection...');
    await conn.connection.db.dropCollection(testCollection);
    
    console.log('\n✅ All tests passed! Railway MongoDB connection is working correctly.');
    
  } catch (error) {
    console.error('\n❌ MongoDB connection test failed:');
    console.error(error);
    
    // Provide troubleshooting tips based on error
    console.log('\nTroubleshooting tips:');
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('- Check if the MongoDB service is running in Railway');
      console.log('- Verify that your IP address is allowed in the MongoDB network access settings');
      console.log('- Make sure the connection string is correct');
    } else if (error.name === 'MongoParseError') {
      console.log('- The MongoDB connection string is invalid');
      console.log('- Check for typos or missing parts in the connection string');
    } else if (error.message.includes('Authentication failed')) {
      console.log('- Username or password is incorrect');
      console.log('- Verify your credentials in the Railway dashboard');
    } else {
      console.log('- Check your network connection');
      console.log('- Verify that the MongoDB service is properly provisioned in Railway');
      console.log('- Check Railway logs for any database-related errors');
    }
  } finally {
    // Close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

// Run the test
testConnection().catch(console.error);
