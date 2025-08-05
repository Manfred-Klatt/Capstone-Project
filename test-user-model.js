require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Set mongoose debug mode
mongoose.set('debug', true);

// Get the User model
const User = require('./src/models/User');

console.log('Testing User model...');
console.log('User model loaded successfully:', User ? 'Yes' : 'No');
console.log('Model name:', User.modelName);
console.log('Schema paths:', Object.keys(User.schema.paths));

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/acnh-quiz';

console.log('\nConnecting to MongoDB...');
console.log('MongoDB URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority'
})
.then(async () => {
  console.log('✅ Successfully connected to MongoDB!');
  
  // Try to find a user
  try {
    const users = await User.find().limit(1);
    console.log('\n📝 Found users:', users.length);
    if (users.length > 0) {
      console.log('First user:', {
        id: users[0]._id,
        username: users[0].username,
        email: users[0].email,
        active: users[0].active
      });
    }
  } catch (err) {
    console.error('Error querying users:', err);
  }
  
  // Close the connection
  mongoose.connection.close(() => {
    console.log('\n🔌 MongoDB connection closed.');
    process.exit(0);
  });
})
.catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err);
  process.exit(1);
});
