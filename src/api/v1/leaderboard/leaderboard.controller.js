const Leaderboard = require('../../../models/Leaderboard');
const User = require('../../../models/userModel');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/appError');
const { successResponse } = require('../../../utils/response');

// Submit a new score
const submitScore = catchAsync(async (req, res, next) => {
  const { category, score, gameData } = req.body;
  const userId = req.user.id;

  // Validate required fields
  if (!category || score === undefined || !gameData) {
    return next(new AppError('Category, score, and game data are required', 400));
  }

  // Validate category
  const validCategories = ['fish', 'bugs', 'sea', 'villagers'];
  if (!validCategories.includes(category)) {
    return next(new AppError('Invalid category', 400));
  }

  // Validate score
  if (typeof score !== 'number' || score < 0 || score > 1000) {
    return next(new AppError('Score must be a number between 0 and 1000', 400));
  }

  // Validate game data
  const { correctAnswers, totalQuestions, timeTaken } = gameData;
  if (!correctAnswers || !totalQuestions || !timeTaken) {
    return next(new AppError('Game data must include correctAnswers, totalQuestions, and timeTaken', 400));
  }

  // Get user info
  const user = await User.findById(userId).select('username');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Create leaderboard entry
  const leaderboardEntry = new Leaderboard({
    userId,
    username: user.username,
    category,
    score,
    gameData: {
      correctAnswers,
      totalQuestions,
      timeTaken,
      difficulty: gameData.difficulty || 'medium'
    }
  });

  await leaderboardEntry.save();

  // Get user's new rank
  const rank = await Leaderboard.getUserRank(userId, category);

  res.status(201).json(successResponse('Score submitted successfully', {
    entry: {
      id: leaderboardEntry._id,
      score: leaderboardEntry.score,
      rank,
      isPersonalBest: leaderboardEntry.isPersonalBest,
      timestamp: leaderboardEntry.timestamp
    }
  }));
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
    const leaderboard = await Leaderboard.getTopScores(category, limit);

    // Add rank to each entry
    const leaderboardWithRanks = leaderboard.map((entry, index) => ({
      rank: index + 1,
      username: entry.username,
      score: entry.score,
      gameData: entry.gameData,
      timestamp: entry.timestamp
    }));

    res.json(successResponse('Leaderboard retrieved successfully', {
      category,
      entries: leaderboardWithRanks,
      total: leaderboardWithRanks.length
    }));
  } catch (error) {
    console.error(`Error getting leaderboard for ${category}:`, error);
    // Return empty leaderboard as fallback
    res.json(successResponse('Leaderboard retrieved (empty)', {
      category,
      entries: [],
      total: 0
    }));
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
        gameData: entry.gameData,
        timestamp: entry.timestamp
      }));
    }

    res.json(successResponse('All leaderboards retrieved successfully', {
      leaderboards,
      lastUpdated: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error in getAllLeaderboards:', error);
    // Return empty leaderboards as fallback
    const emptyLeaderboards = {};
    categories.forEach(category => {
      emptyLeaderboards[category] = [];
    });
    
    res.json(successResponse('Leaderboards retrieved (empty)', {
      leaderboards: emptyLeaderboards,
      lastUpdated: new Date().toISOString()
    }));
  }
});

// Get user's personal stats
const getUserStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const categories = ['fish', 'bugs', 'sea', 'villagers'];

  const stats = {};

  for (const category of categories) {
    const bestScore = await Leaderboard.getUserBestScore(userId, category);
    const rank = bestScore ? await Leaderboard.getUserRank(userId, category) : null;
    const totalGames = await Leaderboard.countDocuments({ userId, category });

    stats[category] = {
      bestScore: bestScore ? bestScore.score : 0,
      rank: rank || null,
      totalGames,
      lastPlayed: bestScore ? bestScore.timestamp : null
    };
  }

  res.json(successResponse('User stats retrieved successfully', { stats }));
});

// Get user's score history for a category
const getUserHistory = catchAsync(async (req, res, next) => {
  const { category } = req.params;
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 20;

  // Validate category
  const validCategories = ['fish', 'bugs', 'sea', 'villagers'];
  if (!validCategories.includes(category)) {
    return next(new AppError('Invalid category', 400));
  }

  const history = await Leaderboard.find({ userId, category })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('score gameData timestamp isPersonalBest')
    .lean();

  res.json(successResponse('User history retrieved successfully', {
    category,
    history,
    total: history.length
  }));
});

module.exports = {
  submitScore,
  getLeaderboard,
  getAllLeaderboards,
  getUserStats,
  getUserHistory
};
