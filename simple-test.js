console.log('Simple test script running...');
console.log('Node.js version:', process.version);
console.log('Current directory:', process.cwd());

// Try to require the User model
try {
  const User = require('./src/models/User');
  console.log('✅ User model loaded successfully!');
  console.log('Model name:', User.modelName);
} catch (err) {
  console.error('❌ Failed to load User model:', err);
}

// Test MongoDB connection
const mongoose = require('mongoose');
require('dotenv').config();

console.log('\nTesting MongoDB connection...');
console.log('MongoDB URI:', process.env.MONGODB_URI || 'Not set');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/acnh-quiz', {
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
  return mongoose.connection.close();
})
.then(() => {
  console.log('🔌 MongoDB connection closed.');
})
.catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err);
});
