// Script to create a test user for API testing
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    console.log('Connection string:', uri.replace(/(\/\/[^:]+:)[^@]+(@)/, '$1*****$2'));
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000
    });
    
    console.log('MongoDB connected successfully');
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Define a simplified User schema for this script
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true
  }
});

// Hash the password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model('User', userSchema);

// Create a test user
const createTestUser = async () => {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('Test user already exists:', existingUser.email);
      return existingUser;
    }
    
    // Create new test user
    const testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!',
      role: 'user',
      active: true
    });
    
    console.log('Test user created successfully:', testUser.email);
    return testUser;
  } catch (err) {
    console.error('Error creating test user:', err);
    throw err;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    const user = await createTestUser();
    console.log('Test user details:', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      active: user.active
    });
  } catch (err) {
    console.error('Script failed:', err);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
};

// Run the script
main();
