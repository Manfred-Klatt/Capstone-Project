const AppError = require('../utils/appError');

/**
 * Validation middleware for leaderboard submission
 */
const validateLeaderboardSubmission = (req, res, next) => {
  const { score, category, difficulty, gameMode } = req.body;

  // Validate required fields
  if (score === undefined || score === null) {
    return next(new AppError('Score is required', 400));
  }

  if (!category) {
    return next(new AppError('Category is required', 400));
  }

  // Validate score is a number
  if (typeof score !== 'number' || isNaN(score) || score < 0) {
    return next(new AppError('Score must be a valid positive number', 400));
  }

  // Validate category
  const validCategories = ['fish', 'bugs', 'sea', 'villagers'];
  if (!validCategories.includes(category)) {
    return next(new AppError('Invalid category', 400));
  }

  // Validate difficulty if provided
  if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
    return next(new AppError('Invalid difficulty level', 400));
  }

  // Validate game mode if provided
  if (gameMode && !['classic', 'timed', 'endless'].includes(gameMode)) {
    return next(new AppError('Invalid game mode', 400));
  }

  next();
};

/**
 * Validation middleware for user registration
 */
const validateUserRegistration = (req, res, next) => {
  const { username, email, password } = req.body;

  // Validate required fields
  if (!username || !email || !password) {
    return next(new AppError('Username, email, and password are required', 400));
  }

  // Validate username length (max 10 characters)
  if (username.length > 10) {
    return next(new AppError('Username must be 10 characters or less', 400));
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  // Validate password length
  if (password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long', 400));
  }

  next();
};

/**
 * Validation middleware for user login
 */
const validateUserLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  next();
};

module.exports = {
  validateLeaderboardSubmission,
  validateUserRegistration,
  validateUserLogin
};
