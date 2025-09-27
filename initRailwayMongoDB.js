/**
 * Initialize Railway MongoDB Database
 * 
 * This script initializes the MongoDB database on Railway with the necessary collections
 * for the Animal Crossing Quiz Game. It creates the following collections:
 * - users
 * - leaderboards
 * - fish_leaderboard
 * - bug_leaderboard
 * - sea_creature_leaderboard
 * - villagers_leaderboard
 * 
 * Usage:
 * node initRailwayMongoDB.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');

// Define collection names
const COLLECTIONS = [
  'users',
  'leaderboards',
  'fish_leaderboard',
  'bug_leaderboard',
  'sea_creature_leaderboard',
  'villagers_leaderboard'
];

// Initialize collections
async function initializeCollections() {
  try {
    console.log('Connecting to Railway MongoDB...');
    const conn = await connectDB();
    
    console.log(`Connected to database: ${conn.connection.name}`);
    console.log(`Host: ${conn.connection.host}`);
    
    // Check existing collections
    const existingCollections = await conn.connection.db.listCollections().toArray();
    const existingCollectionNames = existingCollections.map(c => c.name);
    
    console.log('Existing collections:', existingCollectionNames);
    
    // Create missing collections
    for (const collection of COLLECTIONS) {
      if (!existingCollectionNames.includes(collection)) {
        console.log(`Creating collection: ${collection}`);
        await conn.connection.db.createCollection(collection);
        console.log(`Collection ${collection} created successfully`);
      } else {
        console.log(`Collection ${collection} already exists`);
      }
    }
    
    // Create indexes for leaderboard collections
    console.log('Creating indexes for leaderboard collections...');
    
    // Users collection indexes
    if (existingCollectionNames.includes('users')) {
      await conn.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await conn.connection.db.collection('users').createIndex({ username: 1 }, { unique: true });
      console.log('Created indexes for users collection');
    }
    
    // Leaderboard indexes
    for (const leaderboard of ['fish_leaderboard', 'bug_leaderboard', 'sea_creature_leaderboard', 'villagers_leaderboard']) {
      if (existingCollectionNames.includes(leaderboard)) {
        await conn.connection.db.collection(leaderboard).createIndex({ score: -1 });
        await conn.connection.db.collection(leaderboard).createIndex({ username: 1 });
        console.log(`Created indexes for ${leaderboard} collection`);
      }
    }
    
    console.log('Database initialization complete!');
    
  } catch (error) {
    console.error('Error initializing collections:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the initialization
initializeCollections().catch(console.error);
