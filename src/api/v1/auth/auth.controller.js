const validator = require('validator');
const authService = require('../../../services/auth.service');
const { catchAsync, AppError } = require('../../../utils');
const logger = require('../../../utils/logger');
const User = require('../../../../models/userModel');

// Register a new user
exports.signup = catchAsync(async (req, res, next) => {
  const { username, email, password, passwordConfirm } = req.body;
  
  // Log the incoming request (without sensitive data)
  logger.info('Signup request received', { 
    username: username ? 'provided' : 'missing', 
    email: email ? 'provided' : 'missing',
    hasPassword: !!password,
    hasPasswordConfirm: !!passwordConfirm,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Validate required fields
  const missingFields = [];
  if (!username) missingFields.push('username');
  if (!email) missingFields.push('email');
  if (!password) missingFields.push('password');
  if (!passwordConfirm) missingFields.push('passwordConfirm');
  
  if (missingFields.length > 0) {
    logger.warn('Missing required fields', { missingFields });
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }
  
  // Validate email format
  if (!validator.isEmail(email)) {
    logger.warn('Invalid email format', { email });
    return next(new AppError('Please provide a valid email address', 400));
  }
  
  // Validate password match
  if (password !== passwordConfirm) {
    logger.warn('Passwords do not match');
    return next(new AppError('Passwords do not match', 400));
  }
  
  // Check for existing user with same email or username
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });
  
  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'username';
    logger.warn(`User with this ${field} already exists`, { [field]: existingUser[field] });
    return next(new AppError(`User with this ${field} already exists`, 409));
  }
  try {
    const { user, token } = await authService.signup({
      username,
      email,
      password,
      passwordConfirm
    });

    // Immediately verify the user's active status after creation
    const verifyUser = await User.findById(user._id).setOptions({ skipMiddleware: true });
    logger.info('User signup successful - immediate verification', { 
      userId: user._id, 
      email: user.email,
      username: user.username,
      activeStatus: verifyUser.active,
      createdAt: verifyUser.createdAt
    });

    // Schedule a delayed check to see if account gets deactivated
    setTimeout(async () => {
      try {
        const delayedCheck = await User.findById(user._id).setOptions({ skipMiddleware: true });
        logger.info('Delayed user status check (5 seconds after creation)', {
          userId: user._id,
          email: user.email,
          activeStatus: delayedCheck.active,
          updatedAt: delayedCheck.updatedAt
        });
      } catch (err) {
        logger.error('Error in delayed user status check', { error: err.message });
      }
    }, 5000);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('Signup failed', { 
      error: error.message, 
      stack: error.stack,
      email,
      username
    });
    
    // Handle specific error types
    if (error.code === 11000) {
      // Duplicate key error (MongoDB)
      const field = Object.keys(error.keyPattern)[0];
      const message = `An account with that ${field} already exists.`;
      return next(new AppError(message, 400));
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return next(new AppError(`Validation failed: ${messages.join('. ')}`, 400));
    }
    
    // Pass other errors to the global error handler
    next(error);
  }
});

// Login user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const { user, token } = await authService.login(email, password);

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
});

// Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password`;
  
  await authService.forgotPassword(email, resetURL);

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!',
  });
});

// Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;

  const { token: authToken } = await authService.resetPassword(
    token,
    password,
    passwordConfirm
  );

  res.status(200).json({
    status: 'success',
    token: authToken,
  });
});

// Update password
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  const { token } = await authService.updatePassword(
    req.user.id,
    currentPassword,
    newPassword,
    newPasswordConfirm
  );

  res.status(200).json({
    status: 'success',
    token,
  });
});

// Get current user
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// Reactivate a deactivated account
exports.reactivateAccount = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  
  logger.info('Reactivate account request received', { email });
  
  if (!email) {
    logger.warn('No email provided for account reactivation');
    return next(new AppError('Please provide an email address', 400));
  }
  
  try {
    logger.debug('Attempting to find user by email', { email });
    
    // Find the user (bypassing the active filter)
    const user = await User.findOne({ email: email.toLowerCase() })
      .setOptions({ skipMiddleware: true });
      
    if (!user) {
      logger.warn('User not found for reactivation', { email });
      return next(new AppError('No account found with this email address', 404));
    }
    
    logger.debug('User found, current active status:', { 
      userId: user._id, 
      currentActive: user.active,
      email: user.email 
    });
    
    // Reactivate the account
    user.active = true;
    logger.debug('Attempting to save user with active status:', { active: user.active });
    
    await user.save({ validateBeforeSave: false });
    
    // Verify the save worked by re-querying
    const verifyUser = await User.findOne({ email: email.toLowerCase() })
      .setOptions({ skipMiddleware: true });
    logger.debug('Verification after save:', { 
      savedActive: verifyUser.active,
      updatedAt: verifyUser.updatedAt 
    });
    
    logger.info('Account reactivated successfully', { 
      userId: user._id, 
      email: user.email 
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Account reactivated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username
        }
      }
    });
    
  } catch (err) {
    logger.error('Error in reactivateAccount:', { 
      error: err.message, 
      stack: err.stack,
      email: email,
      timestamp: new Date().toISOString(),
      errorDetails: {
        name: err.name,
        code: err.code,
        keyPattern: err.keyPattern,
        keyValue: err.keyValue
      }
    });
    
    return next(new AppError(`An error occurred while reactivating the account: ${err.message}`, 500));
  }
});
