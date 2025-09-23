const Game = require('../models/Game');
const User = require('../../models/userModel');
const AppError = require('../utils/appError');

// Helper function to generate questions (mock implementation)
const generateQuestions = (category, difficulty, count = 10) => {
  const questions = [];
  for (let i = 0; i < count; i++) {
    questions.push({
      id: i + 1,
      question: `Sample question about ${category} (${difficulty}) #${i + 1}`,
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: Math.floor(Math.random() * 4),
      category,
      difficulty,
    });
  }
  return questions;
};

// Get game categories
const getCategories = () => {
  return {
    categories: ['villagers', 'fish', 'bugs', 'fossils', 'art', 'mixed'],
    difficulties: ['easy', 'medium', 'hard'],
  };
};

// Start a new game
const startGame = async (userId, category, difficulty) => {
  try {
    // In a real app, you would generate questions here
    // For now, we'll just create a game record with basic info
    const game = await Game.create({
      user: userId,
      category,
      difficulty,
      score: 0,
      correctAnswers: 0,
      totalQuestions: 10, // Default number of questions
      timeSpent: 0,
    });

    // Get questions for the game (mock data)
    const questions = generateQuestions(category, difficulty);

    return { game, questions };
  } catch (error) {
    throw error;
  }
};

// Submit game answers
const submitGame = async (gameId, answers, timeSpent) => {
  try {
    // In a real app, you would validate answers and calculate score
    // For now, we'll just update the game with the provided answers
    const game = await Game.findById(gameId);
    
    if (!game) {
      throw new AppError('No game found with that ID', 404);
    }

    // Calculate score (mock implementation)
    const correctAnswers = answers.filter(
      (answer) => answer.isCorrect
    ).length;
    
    const score = Math.round((correctAnswers / game.totalQuestions) * 100);

    // Update game
    game.answers = answers;
    game.correctAnswers = correctAnswers;
    game.score = score;
    game.timeSpent = timeSpent;
    game.completedAt = Date.now();

    await game.save();

    // Update user stats
    await User.findByIdAndUpdate(
      game.user,
      {
        $inc: {
          gamesPlayed: 1,
          totalPoints: score,
        },
        $max: { highScore: score },
      },
      { new: true, runValidators: true }
    );

    return game;
  } catch (error) {
    throw error;
  }
};

// Get game results
const getGameResults = async (gameId) => {
  try {
    const game = await Game.findById(gameId)
      .populate('user', 'username avatar')
      .select('-__v');

    if (!game) {
      throw new AppError('No game found with that ID', 404);
    }

    return game;
  } catch (error) {
    throw error;
  }
};

// Create a new game record (for end-game API)
const createGame = async (gameData) => {
  try {
    const game = await Game.create(gameData);
    
    // Update user stats if user is logged in
    if (gameData.user) {
      await User.findByIdAndUpdate(
        gameData.user,
        {
          $inc: {
            gamesPlayed: 1,
            totalPoints: gameData.score,
          },
          $max: { highScore: gameData.score },
        },
        { new: true, runValidators: true }
      );
    }
    
    return game;
  } catch (error) {
    throw error;
  }
};

// Get leaderboard
const getLeaderboard = async (category, difficulty, limit = 10) => {
  try {
    const leaderboard = await Game.getLeaderboard(category, difficulty, limit);
    return leaderboard;
  } catch (error) {
    throw error;
  }
};

// Get user game history
const getUserGameHistory = async (userId, limit = 10, page = 1) => {
  try {
    const skip = (page - 1) * limit;
    
    const [games, total] = await Promise.all([
      Game.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Game.countDocuments({ user: userId })
    ]);

    return {
      games,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    };
  } catch (error) {
    throw error;
  }
};

// Helper function to generate questions (mock implementation)
const gameServiceGenerateQuestions = async (category, difficulty, count = 10) => {
  // In a real app, this would generate questions based on category and difficulty
  // For now, we'll return mock data
  const mockQuestions = [
    {
      id: '1',
      question: 'What is the name of this villager?',
      image: 'https://acnhapi.com/v1/images/villagers/1',
      options: ['Raymond', 'Marshal', 'Sherb', 'Dom'],
      correctAnswer: 'Raymond',
    },
    // Add more mock questions as needed
  ];

  return mockQuestions;
};

module.exports = {
  getCategories,
  startGame,
  createGame,
  submitGame,
  getGameResults,
  getLeaderboard,
  getUserGameHistory,
  generateQuestions
};
