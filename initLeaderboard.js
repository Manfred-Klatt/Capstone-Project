const connectDB = require('./src/config/db');
const Leaderboard = require('./src/models/leaderboard');

async function initializeLeaderboard() {
  try {
    // Connect to the database
    await connectDB();
    
    console.log('Creating leaderboard indexes...');
    
    // Create indexes
    await Leaderboard.createIndexes();
    
    console.log('Leaderboard indexes created successfully!');
    
    // Verify indexes
    const indexes = await Leaderboard.collection.indexes();
    console.log('Current indexes:');
    console.log(indexes.map(idx => ({
      name: idx.name,
      key: idx.key,
      unique: !!idx.unique
    })));
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing leaderboard:', error);
    process.exit(1);
  }
}

initializeLeaderboard();
