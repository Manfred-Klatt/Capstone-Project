const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB connection...');
console.log('MONGODB_URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 10000,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('✅ Successfully connected to MongoDB!');
  
  // List all collections in the database
  return mongoose.connection.db.listCollections().toArray();
})
.then(collections => {
  console.log('\n📚 Collections in database:');
  collections.forEach(collection => console.log(`- ${collection.name}`));
  
  // Close the connection
  return mongoose.connection.close();
})
.then(() => {
  console.log('\n🔌 MongoDB connection closed.');
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});
