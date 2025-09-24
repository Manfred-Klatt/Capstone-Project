/**
 * Monitor Railway MongoDB
 * 
 * This script provides basic monitoring for your Railway MongoDB instance.
 * It checks connection status, database stats, and collection metrics.
 * 
 * Usage:
 * node monitorRailwayMongoDB.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');

async function monitorMongoDB() {
  try {
    console.log('Connecting to Railway MongoDB...');
    const conn = await connectDB();
    
    console.log('\n=== Railway MongoDB Status ===');
    console.log(`Connected to: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    console.log(`MongoDB version: ${conn.connection.client.serverInfo?.version || 'unknown'}`);
    
    // Get database stats
    const dbStats = await conn.connection.db.stats();
    console.log('\n=== Database Stats ===');
    console.log(`Collections: ${dbStats.collections}`);
    console.log(`Documents: ${dbStats.objects}`);
    console.log(`Storage size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Data size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Indexes: ${dbStats.indexes}`);
    console.log(`Index size: ${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Get collections
    const collections = await conn.connection.db.listCollections().toArray();
    
    console.log('\n=== Collections ===');
    for (const collection of collections) {
      const stats = await conn.connection.db.collection(collection.name).stats();
      console.log(`\n${collection.name}:`);
      console.log(`- Documents: ${stats.count}`);
      console.log(`- Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`- Storage size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`- Indexes: ${stats.nindexes}`);
      console.log(`- Index size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
      
      // Sample documents (first 3)
      if (stats.count > 0) {
        const sampleDocs = await conn.connection.db.collection(collection.name).find({}).limit(3).toArray();
        console.log(`- Sample document fields: ${Object.keys(sampleDocs[0] || {}).join(', ')}`);
      }
    }
    
    // Check for recent operations
    console.log('\n=== Recent Operations ===');
    try {
      const currentOp = await conn.connection.db.admin().command({ currentOp: 1, $all: true });
      const activeOps = currentOp.inprog.filter(op => op.op !== 'none');
      
      if (activeOps.length === 0) {
        console.log('No active operations');
      } else {
        console.log(`Active operations: ${activeOps.length}`);
        activeOps.forEach((op, i) => {
          console.log(`\nOperation ${i + 1}:`);
          console.log(`- Type: ${op.op}`);
          console.log(`- Namespace: ${op.ns}`);
          console.log(`- Duration: ${op.secs_running || 0} seconds`);
          console.log(`- Client: ${op.client || 'unknown'}`);
        });
      }
    } catch (error) {
      console.log('Could not retrieve operation information:', error.message);
    }
    
    // Check server status
    console.log('\n=== Server Status ===');
    try {
      const serverStatus = await conn.connection.db.admin().serverStatus();
      console.log(`Uptime: ${(serverStatus.uptime / 3600).toFixed(2)} hours`);
      console.log(`Connections: ${serverStatus.connections.current} (${serverStatus.connections.available} available)`);
      console.log(`Network: ${serverStatus.network.bytesIn} bytes in, ${serverStatus.network.bytesOut} bytes out`);
      console.log(`Operations: ${serverStatus.opcounters.query} queries, ${serverStatus.opcounters.insert} inserts, ${serverStatus.opcounters.update} updates, ${serverStatus.opcounters.delete} deletes`);
    } catch (error) {
      console.log('Could not retrieve server status:', error.message);
    }
    
  } catch (error) {
    console.error('Error monitoring MongoDB:', error);
  } finally {
    // Close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

// Run the monitoring
monitorMongoDB().catch(console.error);
