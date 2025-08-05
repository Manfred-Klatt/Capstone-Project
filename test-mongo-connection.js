const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/acnh-quiz';

console.log('Testing MongoDB connection...');
console.log('MONGODB_URI:', MONGODB_URI ? 'Found' : 'Not found');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('✅ Successfully connected to MongoDB!');
  
  // List all collections
  mongoose.connection.db.listCollections().toArray((err, collections) => {
    if (err) {
      console.error('Error listing collections:', err);
      process.exit(1);
    }
    
    console.log('\n📚 Collections in database:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Close the connection
    mongoose.connection.close(() => {
      console.log('\n🔌 MongoDB connection closed.');
      process.exit(0);
    });
  });
})
.catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err);
  process.exit(1);
});
