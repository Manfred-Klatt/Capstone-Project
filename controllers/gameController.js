const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Helper function to get leaderboard data
const getLeaderboardData = async (category) => {
  try {
    // Validate category to prevent injection
    const validCategories = ['fish', 'bugs', 'sea', 'villagers'];
    if (!validCategories.includes(category)) {
      category = 'fish'; // Default to fish if invalid category
    }
    
    const pipeline = [
      {
        $match: {
          active: { $ne: false }
          // Removed the highScores filter to ensure we get results even if no scores
        }
      },
      {
        $project: {
          username: 1,
          score: { $ifNull: [`$highScores.${category}`, 0] },
          date: { $ifNull: ["$lastPlayed", "$createdAt"] }
        }
      },
      { $sort: { score: -1, date: -1 } },
      { $limit: 10 }
    ];

    const result = await User.aggregate(pipeline);
    return result || [];
  } catch (error) {
    console.error(`Error in getLeaderboardData for category ${category}:`, error);
    // Return empty array instead of throwing to prevent 500 errors
    return [];
  }
};

exports.getLeaderboard = catchAsync(async (req, res, next) => {
  // Get category from params or query, default to 'fish'
  const category = req.params.category || req.query.category || 'fish';
  const leaderboard = await getLeaderboardData(category);

  // Return just the leaderboard array for direct consumption by the frontend
  res.status(200).json(leaderboard);
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

// Handle guest high score submissions
exports.submitGuestScore = catchAsync(async (req, res, next) => {
  const { username, category, score } = req.body;
  
  if (!username || !category || typeof score === 'undefined') {
    return next(new AppError('Please provide username, category, and score', 400));
  }
  
  // Create a temporary user for the guest score
  const guestUser = await User.create({
    username: username,
    email: `guest_${Date.now()}@example.com`,
    password: 'guestpassword123',
    passwordConfirm: 'guestpassword123',
    role: 'user',
    highScores: { [category]: score },
    lastPlayed: Date.now(),
    gamesPlayed: 1
  });
  
  // Return the updated leaderboard
  const leaderboard = await getLeaderboardData(category);
  
  res.status(201).json({
    status: 'success',
    data: {
      message: 'Guest score submitted successfully',
      leaderboard
    }
  });
});
