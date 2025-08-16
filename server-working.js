const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

// In-memory storage (fallback when MongoDB isn't available)
let users = [];
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
  const token = signToken(user.id);
  const userData = {
    id: user.id,
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
    const currentUser = users.find(user => user.id === decoded.id);

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
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Animal Crossing Quiz API v1 - Server is running!',
    timestamp: new Date().toISOString(),
    storage: 'In-memory (MongoDB fallback)',
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

    // Check if user already exists
    const existingUser = users.find(user => user.email === email || user.username === username);
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email or username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = {
      id: userIdCounter++,
      username,
      email,
      password: hashedPassword,
      role: 'user',
      highScores: {
        fish: 0,
        bugs: 0,
        sea: 0,
        villagers: 0
      },
      gamesPlayed: 0,
      lastPlayed: null,
      createdAt: new Date()
    };

    users.push(newUser);
    console.log(`✅ New user registered: ${username} (${email})`);

    createSendToken(newUser, 201, res);
  } catch (error) {
    console.error('Signup error:', error);
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

    // Find user
    const user = users.find(user => user.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }

    console.log(`✅ User logged in: ${user.username}`);
    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login'
    });
  }
});

// Game routes
app.get('/api/v1/games/leaderboard', (req, res) => {
  try {
    const { category = 'fish' } = req.query;
    
    if (!['fish', 'bugs', 'sea', 'villagers'].includes(category)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid category'
      });
    }

    const leaderboard = users
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

app.post('/api/v1/games/end-game', protect, (req, res) => {
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

    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const isNewHighScore = score > user.highScores[category];
    
    if (isNewHighScore) {
      user.highScores[category] = score;
      user.lastPlayed = new Date();
      user.gamesPlayed += 1;
      console.log(`🏆 New high score for ${user.username} in ${category}: ${score}`);
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

app.get('/api/v1/games/highscores', protect, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Animal Crossing Quiz Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`💾 Using in-memory storage (MongoDB fallback)`);
  console.log(`👥 Users registered: ${users.length}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
