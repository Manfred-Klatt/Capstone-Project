// Script to check if the test user exists in the production database
require('dotenv').config({ path: '.env.production' });
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
  username: String,
  email: String,
  password: String,
  role: String,
  active: Boolean
});

// Check if a user exists and create if not
const checkAndCreateTestUser = async () => {
  try {
    const User = mongoose.model('User', userSchema);
    
    // Check if test user exists
    console.log('Checking if test user exists...');
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('Test user found in database:');
      console.log({
        id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        role: existingUser.role,
        active: existingUser.active,
        hasPassword: !!existingUser.password
      });
      
      // Check if the user has a password field
      if (!existingUser.password) {
        console.log('WARNING: User exists but has no password field!');
      }
      
      return existingUser;
    }
    
    // Create new test user if it doesn't exist
    console.log('Test user not found. Creating new test user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('Test1234!', 12);
    
    const testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'user',
      active: true
    });
    
    console.log('Test user created successfully:');
    console.log({
      id: testUser._id,
      username: testUser.username,
      email: testUser.email,
      role: testUser.role,
      active: testUser.active,
      hasPassword: !!testUser.password
    });
    
    return testUser;
  } catch (err) {
    console.error('Error checking/creating test user:', err);
    throw err;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await checkAndCreateTestUser();
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
