// Script to create a test user in Railway's MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB using Railway's connection string
const connectDB = async () => {
  try {
    // Get the MongoDB URL from Railway environment variables
    let connectionUrl;
    
    if (process.env.MONGO_URL) {
      connectionUrl = process.env.MONGO_URL + '/acnh-quiz';
      console.log('Using MONGO_URL from Railway');
    } else if (process.env.MONGO_PUBLIC_URL) {
      connectionUrl = process.env.MONGO_PUBLIC_URL + '/acnh-quiz';
      console.log('Using MONGO_PUBLIC_URL from Railway');
    } else if (process.env.MONGODB_URI) {
      connectionUrl = process.env.MONGODB_URI;
      console.log('Using MONGODB_URI');
    } else {
      connectionUrl = 'mongodb://localhost:27017/acnh-quiz';
      console.log('Using default local MongoDB URL');
    }
    
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
    default: true,
    select: false
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

// Hash the password before saving
userSchema.pre('save', async function(next) {
  // Only run this function if password was modified
  if (!this.isModified('password')) return next();
  
  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Create test users
const createTestUsers = async () => {
  try {
    const User = mongoose.model('User', userSchema);
    
    // Test users to create
    const testUsers = [
      {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234!',
        role: 'user'
      },
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'Admin1234!',
        role: 'admin'
      }
    ];
    
    console.log('Creating test users...');
    
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, updating password...`);
        
        // Update password
        existingUser.password = userData.password;
        await existingUser.save();
        
        console.log(`Updated password for ${userData.email}`);
      } else {
        // Create new user
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

// Main function
const main = async () => {
  try {
    await connectDB();
    await createTestUsers();
    console.log('\nTest users created successfully!');
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
