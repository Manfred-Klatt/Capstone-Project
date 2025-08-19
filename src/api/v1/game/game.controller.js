const gameService = require('../../../services/game.service');
const userService = require('../../../services/user.service');
const { catchAsync, AppError } = require('../../../utils');

// Get game categories
exports.getCategories = catchAsync(async (req, res, next) => {
  const categories = gameService.getCategories();
  
  res.status(200).json({
    status: 'success',
    data: categories,
  });
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
