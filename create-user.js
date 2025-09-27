#!/usr/bin/env node

/**
 * Universal User Creation Script
 * Consolidates create-test-user.js, create-atlas-user.js, and create-railway-user.js
 * 
 * Usage:
 *   node create-user.js                    # Create default test user
 *   node create-user.js --admin            # Create admin user
 *   node create-user.js --custom           # Interactive mode for custom user
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
const isAdmin = args.includes('--admin');
const isCustom = args.includes('--custom');

// Connect to MongoDB with multiple connection string support
const connectDB = async () => {
  try {
    let connectionUrl;
    
    // Try different environment variables in order of preference
    if (process.env.MONGODB_URI) {
      connectionUrl = process.env.MONGODB_URI;
      console.log('Using MONGODB_URI');
    } else if (process.env.MONGO_URL) {
      connectionUrl = process.env.MONGO_URL + '/acnh-quiz';
      console.log('Using MONGO_URL from Railway');
    } else if (process.env.MONGO_PUBLIC_URL) {
      connectionUrl = process.env.MONGO_PUBLIC_URL + '/acnh-quiz';
      console.log('Using MONGO_PUBLIC_URL from Railway');
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
      message: err.message,
      code: err.code
    });
    process.exit(1);
  }
};

// Define User schema (simplified for this script)
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    maxlength: [10, 'Username must be 10 characters or less']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please provide a valid email'
    }
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
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
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model('User', userSchema);

// Predefined user configurations
const userConfigs = {
  default: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'testpassword123',
    role: 'user'
  },
  admin: {
    username: 'admin',
    email: 'admin@example.com',
    password: 'adminpassword123',
    role: 'admin'
  }
};

// Interactive user input
const getUserInput = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

// Get custom user data interactively
const getCustomUserData = async () => {
  console.log('\n📝 Creating custom user...');
  
  const username = await getUserInput('Username (max 10 chars): ');
  const email = await getUserInput('Email: ');
  const password = await getUserInput('Password (min 8 chars): ');
  const roleInput = await getUserInput('Role (user/admin) [user]: ');
  
  return {
    username: username || 'customuser',
    email: email || 'custom@example.com',
    password: password || 'custompassword123',
    role: roleInput.toLowerCase() === 'admin' ? 'admin' : 'user'
  };
};

// Main function to create user
const createUser = async () => {
  try {
    console.log('🚀 Universal User Creation Script');
    console.log('================================');
    
    // Connect to database
    await connectDB();
    
    // Determine user data based on arguments
    let userData;
    
    if (isCustom) {
      userData = await getCustomUserData();
    } else if (isAdmin) {
      userData = userConfigs.admin;
      console.log('👑 Creating admin user...');
    } else {
      userData = userConfigs.default;
      console.log('👤 Creating default test user...');
    }
    
    console.log(`\nUser details:`);
    console.log(`- Username: ${userData.username}`);
    console.log(`- Email: ${userData.email}`);
    console.log(`- Role: ${userData.role}`);
    console.log(`- Password: ${'*'.repeat(userData.password.length)}`);
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { username: userData.username }
      ]
    });
    
    if (existingUser) {
      console.log(`\n⚠️  User already exists!`);
      console.log(`Updating password for: ${existingUser.email}`);
      
      // Update existing user's password
      existingUser.password = userData.password;
      existingUser.role = userData.role;
      await existingUser.save();
      
      console.log(`✅ Updated password for ${existingUser.email} (${existingUser.role})`);
    } else {
      // Create new user
      const newUser = await User.create(userData);
      console.log(`✅ Created new user: ${newUser.email} (${newUser.role})`);
    }
    
    console.log('\n🎉 User creation completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error creating user:', error.message);
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.values(error.errors).forEach(err => {
        console.error(`- ${err.message}`);
      });
    } else if (error.code === 11000) {
      console.error('Duplicate key error - user with this email/username already exists');
    } else {
      console.error('Full error:', error);
    }
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
    process.exit(0);
  }
};

// Show usage if help requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🚀 Universal User Creation Script

Usage:
  node create-user.js                    # Create default test user
  node create-user.js --admin            # Create admin user  
  node create-user.js --custom           # Interactive mode for custom user
  node create-user.js --help             # Show this help

Default Users:
  Test User:  testuser / test@example.com / testpassword123
  Admin User: admin / admin@example.com / adminpassword123

Environment Variables:
  MONGODB_URI        # Primary connection string
  MONGO_URL          # Railway connection (will append /acnh-quiz)
  MONGO_PUBLIC_URL   # Railway public connection (will append /acnh-quiz)
  
If no environment variables are set, defaults to: mongodb://localhost:27017/acnh-quiz
`);
  process.exit(0);
}

// Run the script
createUser();
