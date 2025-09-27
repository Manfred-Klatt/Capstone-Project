const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../../models/userModel');
const AppError = require('../utils/appError');
const { catchAsync } = require('./error');
const config = require('../config');

// Create and send JWT token
const signToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

// Import createSendToken from utils/jwt.js to avoid duplication
const { createSendToken } = require('../../utils/jwt');

/**
 * Middleware to verify JWT token and attach user to request
 */
const protect = catchAsync(async (req, res, next) => {
  // 1) Get token from header, cookie or query string
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  } else if (req.query?.token) {
    token = req.query.token;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  try {
    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, config.jwt.secret);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password! Please log in again.', 401)
      );
    }

    // 5) Check if account is active
    if (!currentUser.active) {
      return next(
        new AppError('Your account has been deactivated. Please contact support.', 401)
      );
    }

    // 6) Grant access to protected route
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (err) {
    logger.error(`JWT Verification Error: ${err.message}`);
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }
});

/**
 * Middleware to check if user is logged in (for views)
 */
const isLoggedIn = async (req, res, next) => {
  if (req.cookies?.jwt) {
    try {
      // 1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        config.jwt.secret
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser || !currentUser.active) {
        res.clearCookie('jwt');
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        res.clearCookie('jwt');
        return next();
      }

      // 4) User is logged in
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      res.clearCookie('jwt');
      return next();
    }
  }
  next();
};

/**
 * Middleware to restrict access based on user roles
 * @param {...String} roles - Allowed user roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user._id} to ${req.originalUrl}`);
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

/**
 * Middleware to check if user is the owner of the resource or an admin
 * @param {String} modelName - Name of the model for logging
 * @param {String} idParam - Name of the parameter containing the resource ID
 * @param {String} userField - Name of the field that references the user in the model
 */
const checkOwnership = (modelName, idParam = 'id', userField = 'user') => {
  return catchAsync(async (req, res, next) => {
    const Model = require(`../models/${modelName}`);
    const doc = await Model.findById(req.params[idParam]);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    // Allow admins to access any resource
    if (req.user.role === 'admin') return next();

    // Check if the user is the owner of the resource
    const userId = doc[userField]?.id || doc[userField]?.toString();
    if (userId !== req.user.id) {
      logger.warn(`User ${req.user._id} attempted to access ${modelName} ${doc._id} without permission`);
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  });
};

/**
 * Middleware to check if the user is the same as the one being modified
 */
const isSelf = catchAsync(async (req, res, next) => {
  if (req.params.id !== req.user.id && req.user.role !== 'admin') {
    return next(
      new AppError('You can only modify your own account', 403)
    );
  }
  next();
});

module.exports = {
  signToken,
  createSendToken,
  protect,
  restrictTo,
  isLoggedIn,
  checkOwnership,
  isSelf,
};
