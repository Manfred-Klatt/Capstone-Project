const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const MONGODB_URI = 'mongodb+srv://manfredjklatt:ZLjT2en0MjBgjnkF@cluster0.vswiduv.mongodb.net/acnh-quiz?retryWrites=true&w=majority&appName=Cluster0';

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    maxlength: [10, 'Username must be 10 characters or less'],
    minlength: [3, 'Username must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  highScores: {
    fish: { type: Number, default: 0 },
    bugs: { type: Number, default: 0 },
    sea: { type: Number, default: 0 },
    villagers: { type: Number, default: 0 }
  },
  gamesPlayed: { type: Number, default: 0 },
  lastPlayed: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Query middleware to exclude inactive users
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model('User', userSchema);

// Database connection
let isConnected = false;

const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    isConnected = true;
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Test the connection
    const userCount = await User.countDocuments();
    console.log(`👥 Users in database: ${userCount}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    isConnected = false;
    
    // Continue with in-memory fallback
    console.log('⚠️  Continuing with in-memory storage as fallback');
  }
};

// In-memory fallback storage
let memoryUsers = [];
let userIdCounter = 1;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5501', 'http://127.0.0.1:5501', 'http://localhost:8000'],
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));

// Helper functions
const signToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '90d' });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id || user.id);
  const userData = {
    id: user._id || user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'user'
  };

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user: userData }
  });
};

// Auth middleware
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    let currentUser;

    if (isConnected) {
      currentUser = await User.findById(decoded.id).select('+password');
    } else {
      currentUser = memoryUsers.find(user => user.id === decoded.id);
    }

    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token does no longer exist.'
      });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token. Please log in again!'
    });
  }
};

// Routes
app.get('/api/v1/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let userCount = 0;

  if (isConnected) {
    try {
      await mongoose.connection.db.admin().ping();
      dbStatus = 'connected';
      userCount = await User.countDocuments();
    } catch (error) {
      dbStatus = 'error';
    }
  } else {
    userCount = memoryUsers.length;
  }

  res.json({
    status: 'success',
    message: 'Animal Crossing Quiz API v1 - Server is running!',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      type: isConnected ? 'MongoDB Atlas' : 'In-memory fallback',
      users: userCount
    },
    endpoints: {
      auth: {
        signup: '/api/v1/auth/signup',
        login: '/api/v1/auth/login'
      },
      games: {
        leaderboard: '/api/v1/games/leaderboard?category={category}',
        endGame: '/api/v1/games/end-game',
        highscores: '/api/v1/games/highscores'
      }
    }
  });
});

// Auth routes
app.post('/api/v1/auth/signup', async (req, res) => {
  try {
    const { username, email, password, passwordConfirm } = req.body;

    // Validation
    if (!username || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        status: 'error',
        message: 'Passwords do not match'
      });
    }

    if (username.length > 10) {
      return res.status(400).json({
        status: 'error',
        message: 'Username must be 10 characters or less'
      });
    }

    if (isConnected) {
      // MongoDB operation
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'User with this email or username already exists'
        });
      }

      const newUser = await User.create({
        username,
        email,
        password
      });

      console.log(`✅ New user registered (MongoDB): ${username} (${email})`);
      createSendToken(newUser, 201, res);

    } else {
      // In-memory fallback
      const existingUser = memoryUsers.find(user => 
        user.email === email || user.username === username
      );

      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'User with this email or username already exists'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = {
        id: userIdCounter++,
        username,
        email,
        password: hashedPassword,
        role: 'user',
        highScores: { fish: 0, bugs: 0, sea: 0, villagers: 0 },
        gamesPlayed: 0,
        lastPlayed: null,
        createdAt: new Date()
      };

      memoryUsers.push(newUser);
      console.log(`✅ New user registered (Memory): ${username} (${email})`);
      createSendToken(newUser, 201, res);
    }

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email or username already exists'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'An error occurred during registration'
    });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    if (isConnected) {
      // MongoDB operation
      const user = await User.findOne({ email }).select('+password');
      
      if (!user || !(await user.correctPassword(password, user.password))) {
        return res.status(401).json({
          status: 'error',
          message: 'Incorrect email or password'
        });
      }

      console.log(`✅ User logged in (MongoDB): ${user.username}`);
      createSendToken(user, 200, res);

    } else {
      // In-memory fallback
      const user = memoryUsers.find(user => user.email === email);
      
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({
          status: 'error',
          message: 'Incorrect email or password'
        });
      }

      console.log(`✅ User logged in (Memory): ${user.username}`);
      createSendToken(user, 200, res);
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login'
    });
  }
});

// Game routes
app.get('/api/v1/games/leaderboard', async (req, res) => {
  try {
    const { category = 'fish' } = req.query;
    
    if (!['fish', 'bugs', 'sea', 'villagers'].includes(category)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid category'
      });
    }

    let leaderboard = [];

    if (isConnected) {
      // MongoDB aggregation
      leaderboard = await User.aggregate([
        {
          $match: {
            active: { $ne: false },
            [`highScores.${category}`]: { $gt: 0 }
          }
        },
        {
          $project: {
            username: 1,
            score: `$highScores.${category}`,
            lastPlayed: 1
          }
        },
        { $sort: { score: -1, lastPlayed: 1 } },
        { $limit: 10 }
      ]);
    } else {
      // In-memory operation
      leaderboard = memoryUsers
        .filter(user => user.highScores[category] > 0)
        .map(user => ({
          username: user.username,
          score: user.highScores[category],
          lastPlayed: user.lastPlayed
        }))
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return new Date(a.lastPlayed) - new Date(b.lastPlayed);
        })
        .slice(0, 10);
    }

    res.status(200).json({
      status: 'success',
      data: {
        category,
        leaderboard
      }
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching leaderboard'
    });
  }
});

app.post('/api/v1/games/end-game', protect, async (req, res) => {
  try {
    const { category, score } = req.body;

    if (!category || typeof score === 'undefined') {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide category and score'
      });
    }

    if (!['fish', 'bugs', 'sea', 'villagers'].includes(category)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid category'
      });
    }

    let user, isNewHighScore;

    if (isConnected) {
      // MongoDB operation
      user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      isNewHighScore = score > user.highScores[category];
      
      if (isNewHighScore) {
        user.highScores[category] = score;
        user.lastPlayed = new Date();
        user.gamesPlayed += 1;
        await user.save({ validateBeforeSave: false });
        console.log(`🏆 New high score (MongoDB) for ${user.username} in ${category}: ${score}`);
      }

    } else {
      // In-memory operation
      user = memoryUsers.find(u => u.id === req.user.id);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      isNewHighScore = score > user.highScores[category];
      
      if (isNewHighScore) {
        user.highScores[category] = score;
        user.lastPlayed = new Date();
        user.gamesPlayed += 1;
        console.log(`🏆 New high score (Memory) for ${user.username} in ${category}: ${score}`);
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        highScore: user.highScores[category],
        isNewHighScore
      }
    });

  } catch (error) {
    console.error('End game error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while saving score'
    });
  }
});

app.get('/api/v1/games/highscores', protect, async (req, res) => {
  try {
    let user;

    if (isConnected) {
      user = await User.findById(req.user._id).select('highScores gamesPlayed lastPlayed');
    } else {
      user = memoryUsers.find(u => u.id === req.user.id);
    }

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        highscores: user.highScores,
        gamesPlayed: user.gamesPlayed,
        lastPlayed: user.lastPlayed
      }
    });

  } catch (error) {
    console.error('Get highscores error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching highscores'
    });
  }
});

// Error handling
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
});

// Initialize server
const startServer = async () => {
  // Connect to database
  await connectDB();
  
  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Animal Crossing Quiz Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
    console.log(`💾 Storage: ${isConnected ? 'MongoDB Atlas' : 'In-memory fallback'}`);
    
    if (isConnected) {
      console.log(`🌐 Database: ${mongoose.connection.name}`);
    }
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  if (isConnected) {
    await mongoose.connection.close();
    console.log('📊 MongoDB connection closed.');
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  if (isConnected) {
    await mongoose.connection.close();
    console.log('📊 MongoDB connection closed.');
  }
  process.exit(0);
});

// Start the server
startServer().catch(console.error);
