const { validationResult } = require('express-validator');
const { AppError } = require('../utils');

/**
 * Middleware to validate request data using express-validator
 * @param {Array} validations - Array of validation chains
 * @returns {Function} Express middleware function
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = [];
    errors.array().map((err) =>
      extractedErrors.push({ [err.param]: err.msg })
    );

    return next(
      new AppError('Validation failed', 422, {
        errors: extractedErrors,
      })
    );
  };
};

/**
 * Middleware to handle validation errors and send appropriate response
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validationErrorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors,
    });
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      status: 'error',
      message: 'Duplicate field value entered',
      errors: [
        {
          field,
          message: `${field} already exists`,
        },
      ],
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired',
    });
  }

  next(err);
};

module.exports = {
  validate,
  validationErrorHandler,
};
