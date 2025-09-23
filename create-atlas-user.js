// Script to create a test user in MongoDB Atlas
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB using the Atlas connection string
const connectDB = async () => {
  try {
    // Get the MongoDB URI from environment variables
    const connectionUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/acnh-quiz';
    
    // Mask the password in the connection string for logging
    const maskedUrl = connectionUrl.replace(/(\/\/[^:]+:)[^@]+(@)/, '$1*****$2');
    console.log(`MongoDB connection URL (sanitized): ${maskedUrl}`);
    
    // Connection options
    const options = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000
    };
    
    // Connect to MongoDB
    const conn = await mongoose.connect(connectionUrl, options);
    console.log(`MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('Error details:', {
      name: err.name,
      code: err.code || 'N/A',
      stack: err.stack
    });
    process.exit(1);
  }
};

// Define a simplified User schema
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
    minlength: 8
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true
  },
  highScores: {
    fish: { type: Number, default: 0 },
    bugs: { type: Number, default: 0 },
    sea: { type: Number, default: 0 },
    villagers: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create test users with pre-hashed passwords
const createTestUsers = async () => {
  try {
    // Hash passwords directly without using the schema middleware
    const hashedPassword1 = await bcrypt.hash('Test1234!', 12);
    const hashedPassword2 = await bcrypt.hash('Admin1234!', 12);
    
    const User = mongoose.model('User', userSchema);
    
    // Test users to create with pre-hashed passwords
    const testUsers = [
      {
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword1,
        role: 'user'
      },
      {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword2,
        role: 'admin'
      }
    ];
    
    console.log('Creating test users...');
    
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, updating password...`);
        
        // Update password directly with the pre-hashed password
        await User.updateOne(
          { _id: existingUser._id },
          { $set: { password: userData.password } }
        );
        
        console.log(`Updated password for ${userData.email}`);
      } else {
        // Create new user with pre-hashed password
        const newUser = await User.create(userData);
        
        console.log(`Created new user: ${newUser.email} (${newUser.role})`);
      }
    }
    
    // List all users
    const users = await User.find().select('-password');
    console.log('\nAll users in database:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}), role: ${user.role}, active: ${user.active}`);
    });
    
    return users;
  } catch (err) {
    console.error('Error creating test users:', err);
    throw err;
  }
};

// Test password verification
const testPasswordVerification = async () => {
  try {
    const User = mongoose.model('User');
    
    console.log('\nTesting password verification...');
    
    // Find the test user
    const testUser = await User.findOne({ email: 'test@example.com' }).select('+password');
    
    if (!testUser) {
      console.error('Test user not found!');
      return false;
    }
    
    console.log('Test user found:', {
      id: testUser._id,
      email: testUser.email,
      passwordLength: testUser.password ? testUser.password.length : 0
    });
    
    // Test password verification manually
    const password = 'Test1234!';
    const isPasswordCorrect = await bcrypt.compare(password, testUser.password);
    
    console.log(`Password verification result: ${isPasswordCorrect ? 'SUCCESS' : 'FAILED'}`);
    
    return isPasswordCorrect;
  } catch (err) {
    console.error('Error testing password verification:', err);
    return false;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await createTestUsers();
    const passwordVerified = await testPasswordVerification();
    
    if (passwordVerified) {
      console.log('\n✅ Test users created and password verification successful!');
    } else {
      console.error('\n❌ Password verification failed!');
    }
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
