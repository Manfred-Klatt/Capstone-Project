const Leaderboard = require('../../../models/Leaderboard');
const User = require('../../../../models/userModel');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/appError');
const { successResponse } = require('../../../utils/response');

// Submit a new score
const submitScore = catchAsync(async (req, res, next) => {
  const { category, score, playerName } = req.body;
  const userId = req.user.id;

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

  // Get user info
  const user = await User.findById(userId).select('username');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Use playerName if provided, otherwise use username
  const displayName = playerName || user.username;

  // Create leaderboard entry
  const leaderboardEntry = new Leaderboard({
    userId,
    username: displayName,
    category,
    score
  });

  await leaderboardEntry.save();

  // Get user's new rank
  const rank = await Leaderboard.getUserRank(userId, category);

  successResponse(res, 201, 'Score submitted successfully', {
    entry: {
      id: leaderboardEntry._id,
      score: leaderboardEntry.score,
      rank,
      isPersonalBest: leaderboardEntry.isPersonalBest,
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
    const leaderboard = await Leaderboard.getTopScores(category, limit);

    // Add rank to each entry
    const leaderboardWithRanks = leaderboard.map((entry, index) => ({
      rank: index + 1,
      username: entry.username,
      score: entry.score,
      gameData: entry.gameData,
      timestamp: entry.timestamp
    }));

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
        gameData: entry.gameData,
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

  successResponse(res, 200, 'User stats retrieved successfully', { stats });
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
  const { playerName, score, category, gameData } = req.body;

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
  if (typeof playerName !== 'string' || playerName.trim().length === 0 || playerName.length > 50) {
    return next(new AppError('Player name must be a non-empty string with max 50 characters', 400));
  }

  try {
    // Find or create leaderboard for this category
    let leaderboard = await Leaderboard.findOne({ category });
    
    if (!leaderboard) {
      leaderboard = new Leaderboard({
        category,
        scores: []
      });
    }

    // Create score entry
    const scoreEntry = {
      playerName: playerName.trim(),
      score,
      isGuest: true,
      submittedAt: new Date(),
      gameData: gameData || {}
    };

    // Add score to leaderboard
    leaderboard.scores.push(scoreEntry);

    // Sort scores by score (descending) and keep top 100
    leaderboard.scores.sort((a, b) => b.score - a.score);
    if (leaderboard.scores.length > 100) {
      leaderboard.scores = leaderboard.scores.slice(0, 100);
    }

    // Update leaderboard metadata
    leaderboard.lastUpdated = new Date();

    // Save leaderboard
    await leaderboard.save();

    // Find the rank of the submitted score
    const rank = leaderboard.scores.findIndex(s => 
      s.playerName === scoreEntry.playerName && 
      s.score === scoreEntry.score &&
      Math.abs(new Date(s.submittedAt) - scoreEntry.submittedAt) < 1000
    ) + 1;

    successResponse(res, 201, 'Guest score submitted successfully', {
      score: scoreEntry,
      rank,
      totalScores: leaderboard.scores.length,
      category
    });
  } catch (error) {
    console.error('Error submitting guest score:', error);
    return next(new AppError('Failed to submit score', 500));
  }
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
