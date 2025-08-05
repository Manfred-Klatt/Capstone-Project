const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Helper function to get leaderboard data
const getLeaderboardData = async (category) => {
  const pipeline = [
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
  ];

  return await User.aggregate(pipeline);
};

exports.getLeaderboard = catchAsync(async (req, res, next) => {
  const { category = 'fish' } = req.query;
  const leaderboard = await getLeaderboardData(category);

  res.status(200).json({
    status: 'success',
    data: {
      category,
      leaderboard
    }
  });
});

exports.getCategories = catchAsync(async (req, res, next) => {
  const categories = ['fish', 'bugs', 'sea', 'villagers'];
  
  res.status(200).json({
    status: 'success',
    results: categories.length,
    data: {
      categories
    }
  });
});

exports.startGame = catchAsync(async (req, res, next) => {
  const { category } = req.body;
  
  if (!category) {
    return next(new AppError('Please provide a category', 400));
  }

  // Here you would typically initialize a game session
  // For now, we'll just return a success response
  res.status(200).json({
    status: 'success',
    message: 'Game started',
    data: {
      category,
      timestamp: new Date()
    }
  });
});

exports.submitAnswer = catchAsync(async (req, res, next) => {
  const { answer, isCorrect, score } = req.body;
  
  if (typeof isCorrect === 'undefined' || !answer) {
    return next(new AppError('Please provide answer and correctness', 400));
  }

  // Here you would typically process the answer and update the game state
  // For now, we'll just return a success response
  res.status(200).json({
    status: 'success',
    data: {
      correct: isCorrect,
      answer,
      score: score || 0
    }
  });
});

exports.endGame = catchAsync(async (req, res, next) => {
  const { category, score } = req.body;
  
  if (!category || typeof score === 'undefined') {
    return next(new AppError('Please provide category and score', 400));
  }

  const user = await User.findById(req.user.id);
  
  // Update user's high score if the new score is higher
  if (score > user.highScores[category]) {
    user.highScores[category] = score;
    user.lastPlayed = Date.now();
    user.gamesPlayed += 1;
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    status: 'success',
    data: {
      highScore: user.highScores[category],
      isNewHighScore: score === user.highScores[category]
    }
  });
});

exports.getUserHighscores = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('highScores gamesPlayed lastPlayed');
  
  res.status(200).json({
    status: 'success',
    data: {
      highscores: user.highScores,
      gamesPlayed: user.gamesPlayed,
      lastPlayed: user.lastPlayed
    }
  });
});
