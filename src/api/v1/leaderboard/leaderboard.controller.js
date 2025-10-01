const Leaderboard = require('../../../models/Leaderboard');
const User = require('../../../../models/userModel');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/appError');
const { successResponse } = require('../../../utils/response');

// Submit a new score
const submitScore = catchAsync(async (req, res, next) => {
  console.log('🎯 === AUTHENTICATED SCORE SUBMISSION DEBUG ===');
  console.log('Request body:', req.body);
  console.log('User from req.user:', req.user);
  
  const { category, score, playerName } = req.body;

  // Validate required fields
  if (!category || score === undefined) {
    return next(new AppError('Category and score are required', 400));
  }

  // Validate category
  const validCategories = ['fish', 'bugs', 'sea', 'villagers'];
  if (!validCategories.includes(category)) {
    return next(new AppError('Invalid category', 400));
  }

  // Validate score
  if (typeof score !== 'number' || score < 0) {
    return next(new AppError('Score must be a positive number', 400));
  }

  // Get username from authenticated user or use playerName
  let displayName = playerName;
  
  if (req.user) {
    const user = await User.findById(req.user.id).select('username');
    if (user) {
      displayName = playerName || user.username;
    }
  }
  
  if (!displayName) {
    return next(new AppError('Username is required', 400));
  }

  console.log('Final displayName that will be saved:', displayName);

  // Create leaderboard entry
  console.log(`💾 Creating leaderboard entry: ${displayName}, ${score} points in ${category}`);
  const leaderboardEntry = new Leaderboard({
    username: displayName,
    category,
    score
  });

  await leaderboardEntry.save();
  console.log(`✅ Saved leaderboard entry with ID: ${leaderboardEntry._id}`);

  successResponse(res, 201, 'Score submitted successfully', {
    entry: {
      id: leaderboardEntry._id,
      username: leaderboardEntry.username,
      score: leaderboardEntry.score,
      timestamp: leaderboardEntry.timestamp
    }
  });
});

// Get leaderboard for a category
const getLeaderboard = catchAsync(async (req, res, next) => {
  const { category } = req.params;
  const limit = parseInt(req.query.limit) || 10;

  // Validate category
  const validCategories = ['fish', 'bugs', 'sea', 'villagers'];
  if (!validCategories.includes(category)) {
    return next(new AppError('Invalid category', 400));
  }

  // Validate limit
  if (limit < 1 || limit > 100) {
    return next(new AppError('Limit must be between 1 and 100', 400));
  }

  try {
    console.log(`🔍 Getting leaderboard for category: ${category}, limit: ${limit}`);
    const leaderboard = await Leaderboard.getTopScores(category, limit);
    console.log(`📊 Found ${leaderboard.length} entries for ${category}`);

    // Add rank to each entry
    const leaderboardWithRanks = leaderboard.map((entry, index) => ({
      rank: index + 1,
      username: entry.username || 'Anonymous',
      score: entry.score,
      timestamp: entry.timestamp
    }));
    
    console.log('📊 Raw leaderboard entries from database:', leaderboard);
    console.log('📊 Processed leaderboard with ranks:', leaderboardWithRanks);

    console.log(`✅ Returning ${leaderboardWithRanks.length} ranked entries for ${category}`);
    successResponse(res, 200, 'Leaderboard retrieved successfully', {
      category,
      entries: leaderboardWithRanks,
      total: leaderboardWithRanks.length
    });
  } catch (error) {
    console.error(`Error getting leaderboard for ${category}:`, error);
    // Return empty leaderboard as fallback
    successResponse(res, 200, 'Leaderboard retrieved (empty)', {
      category,
      entries: [],
      total: 0
    });
  }
});

// Get all leaderboards
const getAllLeaderboards = catchAsync(async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const categories = ['fish', 'bugs', 'sea', 'villagers'];

  const leaderboards = {};

  try {
    for (const category of categories) {
      const entries = await Leaderboard.getTopScores(category, limit);
      leaderboards[category] = entries.map((entry, index) => ({
        rank: index + 1,
        username: entry.username,
        score: entry.score,
        timestamp: entry.timestamp
      }));
    }

    successResponse(res, 200, 'All leaderboards retrieved successfully', {
      leaderboards,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in getAllLeaderboards:', error);
    // Return empty leaderboards as fallback
    const emptyLeaderboards = {};
    categories.forEach(category => {
      emptyLeaderboards[category] = [];
    });
    
    successResponse(res, 200, 'Leaderboards retrieved (empty)', {
      leaderboards: emptyLeaderboards,
      lastUpdated: new Date().toISOString()
    });
  }
});

// Get user's personal stats
const getUserStats = catchAsync(async (req, res, next) => {
  const username = req.user.username;
  const categories = ['fish', 'bugs', 'sea', 'villagers'];

  const stats = {};

  for (const category of categories) {
    // Get user's best score by username
    const userScores = await Leaderboard.find({ username, category })
      .sort({ score: -1 })
      .limit(1)
      .lean();
    
    const bestScore = userScores.length > 0 ? userScores[0] : null;
    const totalGames = await Leaderboard.countDocuments({ username, category });

    stats[category] = {
      bestScore: bestScore ? bestScore.score : 0,
      totalGames,
      lastPlayed: bestScore ? bestScore.timestamp : null
    };
  }

  successResponse(res, 200, 'User stats retrieved successfully', { stats });
});

// Get user's score history for a category
const getUserHistory = catchAsync(async (req, res, next) => {
  const { category } = req.params;
  const username = req.user.username;
  const limit = parseInt(req.query.limit) || 20;

  // Validate category
  const validCategories = ['fish', 'bugs', 'sea', 'villagers'];
  if (!validCategories.includes(category)) {
    return next(new AppError('Invalid category', 400));
  }

  const history = await Leaderboard.find({ username, category })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('score timestamp')
    .lean();

  successResponse(res, 200, 'User history retrieved successfully', {
    category,
    history,
    total: history.length
  });
});

// Reset all leaderboards
const resetAllLeaderboards = catchAsync(async (req, res, next) => {
  await Leaderboard.deleteMany({});

  successResponse(res, 200, 'All leaderboards reset successfully');
});

// Submit a guest score (without user authentication)
const submitGuestScore = catchAsync(async (req, res, next) => {
  console.log('👤 === GUEST SCORE SUBMISSION DEBUG ===');
  console.log('Request body:', req.body);
  
  const { playerName, score, category } = req.body;

  // Validate required fields
  if (!playerName || score === undefined || !category) {
    return next(new AppError('Player name, score, and category are required', 400));
  }

  // Validate category
  const validCategories = ['fish', 'bugs', 'sea', 'villagers'];
  if (!validCategories.includes(category)) {
    return next(new AppError('Invalid category', 400));
  }

  // Validate score
  if (typeof score !== 'number' || score < 0) {
    return next(new AppError('Score must be a positive number', 400));
  }

  // Validate player name
  if (typeof playerName !== 'string' || playerName.trim().length === 0 || playerName.length > 10) {
    return next(new AppError('Player name must be a non-empty string with max 10 characters', 400));
  }

  // Create leaderboard entry
  console.log(`💾 Creating guest leaderboard entry: ${playerName}, ${score} points in ${category}`);
  const leaderboardEntry = new Leaderboard({
    username: playerName.trim(),
    category,
    score
  });

  await leaderboardEntry.save();
  console.log(`✅ Saved guest leaderboard entry with ID: ${leaderboardEntry._id}`);

  successResponse(res, 201, 'Guest score submitted successfully', {
    entry: {
      id: leaderboardEntry._id,
      username: leaderboardEntry.username,
      score: leaderboardEntry.score,
      timestamp: leaderboardEntry.timestamp
    }
  });
});

module.exports = {
  submitScore,
  getLeaderboard,
  getAllLeaderboards,
  getUserStats,
  getUserHistory,
  resetAllLeaderboards,
  submitGuestScore
};
