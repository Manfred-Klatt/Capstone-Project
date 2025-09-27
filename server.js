// DEPRECATED: This is a legacy standalone server file
// The main application now uses src/app.js with proper middleware architecture
// This file is kept for reference but should NOT be used for deployment
// Railway deployment should use: node src/app.js

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8000', 'https://blathers.app', 'https://www.blathers.app'],
  credentials: true
}));

// Serve static files
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://manfredjklatt:ZLjT2en0MjBgjnkF@cluster0.vswiduv.mongodb.net/acnh-quiz?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 20,
    minlength: 3
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
  },
  highScore: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

const User = mongoose.model('User', userSchema);

// JWT Helper
const signToken = (id) => {
  return jwt.sign({ id }, 'acnh_quiz_production_secret_2024_secure_key_blathers_app', {
    expiresIn: '90d'
  });
};

// Routes
// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      state: mongoose.connection.readyState
    }
  });
});

// Auth routes
app.post('/api/v1/auth/signup', async (req, res) => {
  try {
    const { username, email, password, passwordConfirm } = req.body;
    
    console.log('Signup request received:', { username, email });
    
    // Validate required fields
    if (!username || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide all required fields'
      });
    }
    
    // Validate password match
    if (password !== passwordConfirm) {
      return res.status(400).json({
        status: 'fail',
        message: 'Passwords do not match'
      });
    }
    
    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(409).json({
        status: 'fail',
        message: `User with this ${field} already exists`
      });
    }
    
    // Create new user
    const newUser = await User.create({
      username,
      email,
      password,
      role: 'user'
    });
    
    // Generate JWT token
    const token = signToken(newUser._id);
    
    // Remove password from output
    newUser.password = undefined;
    
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during signup'
    });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login request received:', { email });
    
    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }
    
    // Find user by email and include password for verification
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }
    
    // Check if user is active
    if (!user.active) {
      return res.status(401).json({
        status: 'fail',
        message: 'Your account is inactive. Please reactivate it.'
      });
    }
    
    // Generate JWT token
    const token = signToken(user._id);
    
    // Remove password from output
    user.password = undefined;
    
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login'
    });
  }
});

app.post('/api/v1/auth/reactivate-account', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('Reactivation request received:', { email });
    
    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide an email address'
      });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No user found with that email address'
      });
    }
    
    // Reactivate the account
    user.active = true;
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
      status: 'success',
      message: 'Account reactivated successfully'
    });
  } catch (error) {
    console.error('Reactivation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during account reactivation'
    });
  }
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return res.status(404).json({
      status: 'fail',
      message: `Can't find ${req.originalUrl} on this server!`
    });
  }
  
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB URI: ${MONGODB_URI ? 'is set' : 'is NOT set'}`);
});
