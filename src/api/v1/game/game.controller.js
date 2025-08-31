const gameService = require('../../../services/game.service');
const userService = require('../../../services/user.service');
const { catchAsync, AppError } = require('../../../utils');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Get game categories
exports.getCategories = catchAsync(async (req, res, next) => {
  const categories = gameService.getCategories();
  
  res.status(200).json({
    status: 'success',
    data: categories,
  });
});

// Proxy endpoint to fetch Nookipedia data and bypass CORS
exports.getNookipediaData = catchAsync(async (req, res, next) => {
  const { category } = req.params;
  const fs = require('fs');
  const path = require('path');
  
  // Validate category
  const validCategories = ['fish', 'bugs', 'sea', 'villagers'];
  if (!validCategories.includes(category)) {
    return next(new AppError('Invalid category. Must be one of: fish, bugs, sea, villagers', 400));
  }
  
  try {
    // Check if API key is available
    const apiKey = process.env.NOOKIPEDIA_API_KEY;
    if (!apiKey) {
      console.warn('Missing Nookipedia API key. Using local fallback data.');
      // Use local fallback data
      const fallbackPath = path.join(__dirname, '../../../../fallback-data.json');
      if (fs.existsSync(fallbackPath)) {
        const fallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        if (fallbackData && fallbackData[category] && Array.isArray(fallbackData[category])) {
          console.log(`Using local fallback data for ${category}`);
          return res.status(200).json({
            status: 'success',
            results: fallbackData[category].length,
            data: fallbackData[category],
            source: 'fallback'
          });
        }
      }
      return next(new AppError('No API key and no fallback data available', 500));
    }
    
    console.log(`Fetching ${category} data from Nookipedia API with key: ${apiKey.substring(0, 5)}...`);
    
    const nookipediaUrl = `https://api.nookipedia.com/${category}`;
    const response = await fetch(nookipediaUrl, {
      headers: {
        'X-API-KEY': apiKey,
        'Accept-Version': '1.0.0',
        'User-Agent': 'Animal Crossing Quiz App'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`Nookipedia API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No data returned from Nookipedia API');
    }
    
    console.log(`Successfully fetched ${data.length} ${category} items from Nookipedia`);
    
    res.status(200).json({
      status: 'success',
      results: data.length,
      data: data,
      source: 'api'
    });
    
  } catch (error) {
    console.error(`Error fetching ${category} from Nookipedia:`, error);
    
    // Try to use fallback data if API request fails
    try {
      const fallbackPath = path.join(__dirname, '../../../../fallback-data.json');
      if (fs.existsSync(fallbackPath)) {
        const fallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        if (fallbackData && fallbackData[category] && Array.isArray(fallbackData[category])) {
          console.log(`API request failed. Using local fallback data for ${category}`);
          return res.status(200).json({
            status: 'success',
            results: fallbackData[category].length,
            data: fallbackData[category],
            source: 'fallback'
          });
        }
      }
    } catch (fallbackError) {
      console.error('Failed to load fallback data:', fallbackError);
    }
    
    return next(new AppError(`Failed to fetch ${category} data: ${error.message}`, 500));
  }
});

// Start a new game
exports.startGame = catchAsync(async (req, res, next) => {
  const { category, difficulty } = req.body;
  const userId = req.user ? req.user.id : null;

  const { game, questions } = await gameService.startGame(
    userId,
    category,
    difficulty
  );

  res.status(201).json({
    status: 'success',
    data: {
      game,
      questions,
    },
  });
});

// End game and submit score (matches frontend API call)
exports.endGame = catchAsync(async (req, res, next) => {
  const { score, category, difficulty, timeSpent, answers } = req.body;
  const userId = req.user ? req.user.id : null;

  // Create game record for leaderboard
  const gameData = {
    user: userId,
    category: category || 'mixed',
    difficulty: difficulty || 'medium',
    score: parseInt(score) || 0,
    timeSpent: parseInt(timeSpent) || 0,
    totalQuestions: answers ? answers.length : 10,
    correctAnswers: parseInt(score) || 0,
    completedAt: new Date(),
    answers: answers || []
  };

  const game = await gameService.createGame(gameData);
  
  // Get updated leaderboard for this category
  const leaderboard = await gameService.getLeaderboard(category, difficulty, 10);
  
  // Check if this is a high score
  const isHighScore = leaderboard.length < 10 || 
    score > leaderboard[leaderboard.length - 1].score;

  res.status(200).json({
    status: 'success',
    data: {
      game,
      leaderboard,
      isHighScore,
      rank: leaderboard.findIndex(entry => entry._id.toString() === game._id.toString()) + 1
    }
  });
});

// Submit game answers
exports.submitGame = catchAsync(async (req, res, next) => {
  const { gameId } = req.params;
  const { answers, timeSpent } = req.body;
  const userId = req.user ? req.user.id : null;

  const game = await gameService.submitGame(gameId, answers, timeSpent);

  // Check if the user is the owner of the game or an admin
  if (userId && game.user.toString() !== userId && req.user.role !== 'admin') {
    return next(
      new AppError('You are not authorized to submit this game', 403)
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      game,
    },
  });
});

// Get game results
exports.getGameResults = catchAsync(async (req, res, next) => {
  const { gameId } = req.params;
  const userId = req.user ? req.user.id : null;

  const game = await gameService.getGameResults(gameId);

  // Check if the user is the owner of the game or an admin
  if (userId && game.user._id.toString() !== userId && req.user.role !== 'admin') {
    return next(
      new AppError('You are not authorized to view these results', 403)
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      game,
    },
  });
});

// Get leaderboard
exports.getLeaderboard = catchAsync(async (req, res, next) => {
  const { category, difficulty, limit } = req.query;
  
  const leaderboard = await gameService.getLeaderboard(
    category,
    difficulty,
    parseInt(limit) || 10
  );

  res.status(200).json({
    status: 'success',
    results: leaderboard.length,
    data: {
      leaderboard,
    },
  });
});

// Get user game history
exports.getUserGameHistory = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  // If no userId is provided and user is logged in, use their ID
  const targetUserId = userId || (req.user ? req.user.id : null);
  
  if (!targetUserId) {
    return next(new AppError('Please provide a user ID or log in', 400));
  }

  const history = await gameService.getUserGameHistory(
    targetUserId,
    parseInt(limit),
    parseInt(page)
  );
  
  res.status(200).json({
    status: 'success',
    data: history,
  });
});

// Get user stats
exports.getUserStats = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  
  // If no userId is provided and user is logged in, use their ID
  const targetUserId = userId || (req.user ? req.user.id : null);
  
  if (!targetUserId) {
    return next(new AppError('Please provide a user ID or log in', 400));
  }

  const stats = await userService.getUserStats(targetUserId);
  
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// Proxy for images to bypass CORS
exports.proxyImage = catchAsync(async (req, res, next) => {
  const { url } = req.query;
  
  if (!url) {
    return next(new AppError('Image URL is required', 400));
  }
  
  try {
    // Check for authentication - allow both regular auth and guest token
    const guestImageToken = process.env.GUEST_IMAGE_TOKEN || 'x2y5z8a3b6c9d1e4f7g2h5j8k3m6n9p2';
    const isAuthenticated = req.user || 
                           req.headers['x-guest-token'] === guestImageToken || 
                           req.query.token === guestImageToken;
    
    if (!isAuthenticated) {
      console.warn('Unauthorized image proxy access attempt');
      return next(new AppError('Authentication required for image proxy', 401));
    }
    
    // Decode the URL once and validate it's a proper URL
    const decodedUrl = decodeURIComponent(url);
    
    // Validate URL format before proceeding
    if (!decodedUrl.match(/^https?:\/\//i)) {
      return next(new AppError('Invalid URL format', 400));
    }
    
    try {
      // Parse the URL
      const parsedUrl = new URL(decodedUrl);
      
      // Only allow http and https protocols
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return next(new AppError(`Protocol not allowed: ${parsedUrl.protocol}`, 403));
      }
      
      // Only allow specific domains for security (exact match required)
      const allowedDomains = ['dodo.ac', 'acnhapi.com', 'nookipedia.com'];
      const isAllowed = allowedDomains.some(domain => {
        // Check if hostname ends with the allowed domain
        return parsedUrl.hostname === domain || 
               parsedUrl.hostname.endsWith('.' + domain);
      });
      
      if (!isAllowed) {
        console.warn(`Blocked proxy request to unauthorized domain: ${parsedUrl.hostname}`);
        return next(new AppError(`Domain not allowed: ${parsedUrl.hostname}`, 403));
      }
      
      console.log(`Proxying image from: ${decodedUrl}`);
    } catch (error) {
      return next(new AppError(`Invalid URL: ${error.message}`, 400));
    }
    
    // Set CORS headers to allow cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Guest-Token, Authorization');
    
    // For OPTIONS requests (preflight), return 200 OK with CORS headers
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Use node-fetch instead of http/https for better error handling
    const response = await fetch(decodedUrl, {
      timeout: 8000, // 8 second timeout
      headers: {
        'User-Agent': 'Animal Crossing Quiz App Image Proxy'
      }
    });
    
    if (!response.ok) {
      console.error(`Image fetch failed with status: ${response.status}`);
      return next(new AppError(`Image not found: ${response.status}`, response.status));
    }
    
    // Get the image data as a buffer
    const imageBuffer = await response.buffer();
    
    // Set appropriate headers
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Send the image data
    res.send(imageBuffer);
    
  } catch (error) {
    console.error('Error processing image proxy request:', error);
    return next(new AppError(`Failed to process image: ${error.message}`, 500));
  }
});
