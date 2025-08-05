console.log('Starting minimal test...');

// Load environment variables
require('dotenv').config();

// Test MongoDB connection
const mongoose = require('mongoose');

console.log('1. Testing MongoDB connection...');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  
  // Test User model
  try {
    const User = require('./src/models/User');
    console.log('✅ User model loaded successfully!');
    
    // Try to find a user
    return User.findOne().then(user => {
      if (user) {
        console.log('✅ Found user:', user.email);
      } else {
        console.log('ℹ️ No users found in database');
      }
    });
  } catch (err) {
    console.error('❌ Error loading User model:', err);
    throw err;
  }
})
.then(() => {
  console.log('✅ All tests completed successfully!');
  process.exit(0);
})
.catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
