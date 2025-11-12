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

// Get game data - uses local fallback when Nookipedia API is unavailable
exports.getNookipediaData = catchAsync(async (req, res, next) => {
  const { category } = req.params;
  
  // Validate category
  const validCategories = ['fish', 'bugs', 'sea', 'villagers'];
  if (!validCategories.includes(category)) {
    return next(new AppError('Invalid category. Must be one of: fish, bugs, sea, villagers', 400));
  }
  
  // Check if API key is available
  const apiKey = process.env.NOOKIPEDIA_API_KEY;
  
  // If API key is available, try to fetch from Nookipedia
  if (apiKey && apiKey.trim() && !apiKey.includes('your_actual_api_key_here')) {
    try {
      console.log(`Fetching ${category} data from Nookipedia API...`);
      
      // Nookipedia uses 'villagers' not 'nh/villagers'
      const endpoint = category === 'villagers' ? 'villagers' : `nh/${category}`;
      const nookipediaUrl = `https://api.nookipedia.com/${endpoint}`;
      
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
      
      // Normalize villager data from Nookipedia API
      let normalizedData = data;
      if (category === 'villagers') {
        normalizedData = data.map(villager => ({
          name: villager.name,
          species: villager.species || 'Unknown',
          personality: villager.personality || 'Unknown',
          gender: villager.gender || 'Unknown',
          birthday: villager.birthday_month && villager.birthday_day 
            ? `${villager.birthday_month}/${villager.birthday_day}` 
            : null,
          hobby: villager.hobby || null,
          image_url: villager.image_url || villager.photo_url || null,
          icon_url: villager.icon_url || null
        }));
      }
      
      return res.status(200).json({
        status: 'success',
        results: normalizedData.length,
        data: normalizedData,
        source: 'api'
      });
      
    } catch (error) {
      console.warn(`Nookipedia API failed for ${category}, falling back to local data:`, error.message);
      // Fall through to local data fallback
    }
  } else {
    console.log(`No valid Nookipedia API key found, using local data for ${category}`);
  }
  
  // Fallback to local data
  try {
    const fallbackPath = path.join(__dirname, '../../../../data', `${category}.json`);
    
    if (!fs.existsSync(fallbackPath)) {
      return next(new AppError(`No local data available for ${category}`, 404));
    }
    
    let localData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
    
    // Handle villagers.json which is an object, not an array
    if (category === 'villagers' && !Array.isArray(localData)) {
      // Convert object to array
      localData = Object.values(localData).map(villager => ({
        name: villager.name?.['name-USen'] || villager.name || 'Unknown',
        species: villager.species || 'Unknown',
        personality: villager.personality || 'Unknown',
        gender: villager.gender || 'Unknown',
        birthday: villager.birthday || null,
        'birthday-string': villager['birthday-string'] || null,
        hobby: villager.hobby || null,
        'catch-phrase': villager['catch-phrase'] || null,
        saying: villager.saying || null,
        image_url: villager.image_uri || null,
        icon_url: villager.icon_uri || null
      }));
      
      console.log(`Converted villagers object to array: ${localData.length} villagers`);
    }
    
    if (!Array.isArray(localData) || localData.length === 0) {
      return next(new AppError(`Invalid local data for ${category}`, 500));
    }
    
    console.log(`Using local fallback data for ${category}: ${localData.length} items`);
    
    res.status(200).json({
      status: 'success',
      results: localData.length,
      data: localData,
      source: 'local'
    });
    
  } catch (error) {
    console.error(`Error loading local data for ${category}:`, error);
    return next(new AppError(`Failed to load ${category} data: ${error.message}`, 500));
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

// Image proxy removed - using direct image loading
