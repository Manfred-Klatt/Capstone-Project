const { body, validationResult } = require('express-validator');
const AppError = require('../utils/appError');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new AppError(errorMessages.join('. '), 400));
  }
  next();
};

const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const validatePasswordReset = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  handleValidationErrors
];

const validatePasswordUpdate = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('passwordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  handleValidationErrors
];

const validateLeaderboardSubmission = [
  body('category')
    .isIn(['fish', 'bugs', 'sea', 'villagers'])
    .withMessage('Category must be one of: fish, bugs, sea, villagers'),
  
  body('score')
    .isNumeric()
    .withMessage('Score must be a number')
    .isInt({ min: 0 })
    .withMessage('Score must be a positive number'),
  
  body('gameData.correctAnswers')
    .isNumeric()
    .withMessage('Correct answers must be a number')
    .isInt({ min: 0 })
    .withMessage('Correct answers must be 0 or greater'),
  
  body('gameData.totalQuestions')
    .isNumeric()
    .withMessage('Total questions must be a number')
    .isInt({ min: 1 })
    .withMessage('Total questions must be 1 or greater'),
  
  body('gameData.timeTaken')
    .isNumeric()
    .withMessage('Time taken must be a number')
    .isInt({ min: 1 })
    .withMessage('Time taken must be 1 second or greater'),
  
  body('gameData.difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be one of: easy, medium, hard'),
  
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validatePasswordUpdate,
  validateLeaderboardSubmission,
  handleValidationErrors
};
