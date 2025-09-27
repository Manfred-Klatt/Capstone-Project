/**
 * Migrate Data from MongoDB Atlas to Railway MongoDB
 * 
 * This script migrates data from MongoDB Atlas to Railway MongoDB.
 * It copies all collections and documents from the source database to the target database.
 * 
 * Usage:
 * node migrateToRailwayMongoDB.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

// Source MongoDB Atlas connection string
const SOURCE_URI = process.env.MONGODB_ATLAS_URI || 'mongodb+srv://manfredjklatt:ZLjT2en0MjBgjnkF@cluster0.vswiduv.mongodb.net/acnh-quiz?retryWrites=true&w=majority&appName=Cluster0';

// Target Railway MongoDB connection string
const TARGET_URI = process.env.MONGODB_URI;

// Database name
const DB_NAME = 'acnh-quiz';

// Collections to migrate
const COLLECTIONS = [
  'users',
  'leaderboards',
  'fish_leaderboard',
  'bug_leaderboard',
  'sea_creature_leaderboard',
  'villagers_leaderboard'
];

// Migrate data
async function migrateData() {
  if (!TARGET_URI) {
    console.error('❌ MONGODB_URI environment variable is not set!');
    console.log('Please make sure you have set up the MongoDB connection in Railway.');
    process.exit(1);
  }
  
  console.log('Starting migration from MongoDB Atlas to Railway MongoDB...');
  console.log(`Source: MongoDB Atlas (${SOURCE_URI.substring(0, 20)}...)`);
  console.log(`Target: Railway MongoDB (${TARGET_URI.substring(0, 20)}...)`);
  console.log(`Database: ${DB_NAME}`);
  
  let sourceClient, targetClient;
  
  try {
    // Connect to source database (MongoDB Atlas)
    console.log('\nConnecting to source database (MongoDB Atlas)...');
    sourceClient = new MongoClient(SOURCE_URI);
    await sourceClient.connect();
    console.log('✅ Connected to source database');
    
    // Connect to target database (Railway MongoDB)
    console.log('\nConnecting to target database (Railway MongoDB)...');
    targetClient = new MongoClient(TARGET_URI);
    await targetClient.connect();
    console.log('✅ Connected to target database');
    
    // Get database references
    const sourceDb = sourceClient.db(DB_NAME);
    const targetDb = targetClient.db(DB_NAME);
    
    // Get all collections from source database
    const sourceCollections = await sourceDb.listCollections().toArray();
    const sourceCollectionNames = sourceCollections.map(c => c.name);
    
    console.log('\nCollections in source database:');
    sourceCollectionNames.forEach(name => console.log(`- ${name}`));
    
    // Migrate each collection
    for (const collectionName of COLLECTIONS) {
      if (!sourceCollectionNames.includes(collectionName)) {
        console.log(`\nSkipping collection ${collectionName} - not found in source database`);
        continue;
      }
      
      console.log(`\nMigrating collection: ${collectionName}`);
      
      // Get source collection
      const sourceCollection = sourceDb.collection(collectionName);
      
      // Count documents in source collection
      const documentCount = await sourceCollection.countDocuments();
      console.log(`Found ${documentCount} documents in ${collectionName}`);
      
      if (documentCount === 0) {
        console.log(`Collection ${collectionName} is empty, skipping...`);
        continue;
      }
      
      // Check if collection exists in target database
      const targetCollections = await targetDb.listCollections({ name: collectionName }).toArray();
      if (targetCollections.length > 0) {
        // Collection exists, drop it first
        console.log(`Collection ${collectionName} already exists in target database, dropping...`);
        await targetDb.collection(collectionName).drop();
      }
      
      // Create collection in target database
      await targetDb.createCollection(collectionName);
      const targetCollection = targetDb.collection(collectionName);
      
      // Copy all documents
      console.log(`Copying ${documentCount} documents...`);
      const documents = await sourceCollection.find({}).toArray();
      
      if (documents.length > 0) {
        const result = await targetCollection.insertMany(documents);
        console.log(`✅ Inserted ${result.insertedCount} documents into ${collectionName}`);
      }
      
      // Copy indexes
      console.log('Copying indexes...');
      const indexes = await sourceCollection.indexes();
      
      // Skip the _id_ index as it's created automatically
      const customIndexes = indexes.filter(index => index.name !== '_id_');
      
      for (const index of customIndexes) {
        const { key, name, unique, sparse, expireAfterSeconds, partialFilterExpression } = index;
        
        const options = {
          name,
          unique: !!unique,
          sparse: !!sparse,
          background: true
        };
        
        if (expireAfterSeconds !== undefined) {
          options.expireAfterSeconds = expireAfterSeconds;
        }
        
        if (partialFilterExpression) {
          options.partialFilterExpression = partialFilterExpression;
        }
        
        await targetCollection.createIndex(key, options);
        console.log(`Created index ${name} on ${collectionName}`);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    
    // Verify migration
    console.log('\nVerifying migration...');
    for (const collectionName of COLLECTIONS) {
      if (!sourceCollectionNames.includes(collectionName)) {
        continue;
      }
      
      const sourceCount = await sourceDb.collection(collectionName).countDocuments();
      const targetCount = await targetDb.collection(collectionName).countDocuments();
      
      console.log(`${collectionName}: ${sourceCount} documents in source, ${targetCount} documents in target`);
      
      if (sourceCount !== targetCount) {
        console.warn(`⚠️ Document count mismatch for ${collectionName}!`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
  } finally {
    // Close connections
    if (sourceClient) {
      await sourceClient.close();
      console.log('Closed connection to source database');
    }
    
    if (targetClient) {
      await targetClient.close();
      console.log('Closed connection to target database');
    }
  }
}

// Run the migration
migrateData().catch(console.error);
