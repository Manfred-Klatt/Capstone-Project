const User = require('../src/models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const InputValidator = require('../utils/inputValidator');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, req, res) => {
  try {
    console.log('Creating token for user:', user.email);
    const token = signToken(user._id);
    
    // Create a clean user object without sensitive data
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    console.log('Token created successfully');
    return res.status(statusCode).json({
      status: 'success',
      token,
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Error in createSendToken:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while generating authentication token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.signup = async (req, res, next) => {
  try {
    // Input validation
    const { username, email, password, passwordConfirm } = req.body;
    
    // Check for required fields
    if (!username || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }
    
    // Check if passwords match
    if (password !== passwordConfirm) {
      return res.status(400).json({
        status: 'error',
        message: 'Passwords do not match'
      });
    }
    
    // Check password length
    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long'
      });
    }
    
    // Check username length (from your memory: 10-character limit)
    if (username.length > 10) {
      return res.status(400).json({
        status: 'error',
        message: 'Username must be 10 characters or less'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() }, 
        { username: new RegExp(`^${username.trim()}$`, 'i') }
      ]
    });
    
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is already in use'
        });
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'Username is already in use'
        });
      }
    }

    // Create new user
    const newUser = await User.create({
      username: username.trim(),
      email: email.toLowerCase(),
      password,
      passwordConfirm
    });

    // Remove password from output
    newUser.password = undefined;
    newUser.active = undefined;

    // Send response with token
    createSendToken(newUser, 201, res);
    
  } catch (err) {
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(el => el.message);
      return res.status(400).json({
        status: 'error',
        message: `Invalid input data: ${messages.join('. ')}`
      });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        status: 'error',
        message: `${field} is already in use`
      });
    }
    
    // Handle other errors
    console.error('Unexpected error in signup:', err);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred during signup'
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for email:', email);

    // 1) Check if email and password exist
    if (!email || !password) {
      const error = new AppError('Please provide email and password!', 400);
      if (next) return next(error);
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    
    // 2) Check if user exists (bypass the active filter)
    console.log('Finding user in database...');
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password +active')
      .setOptions({ skipMiddleware: true });

    console.log('User found:', user ? 'Yes' : 'No');

    // 3) Check if user exists
    if (!user) {
      const error = new AppError('No account found with this email address', 401);
      if (next) return next(error);
      return res.status(401).json({
        status: 'error',
        message: error.message
      });
    }

    // 4) Check if account is active
    if (user.active === false) {
      const error = new AppError('This account has been deactivated. Please contact support to reactivate your account.', 403);
      if (next) return next(error);
      return res.status(403).json({
        status: 'error',
        message: error.message
      });
    }

    // 5) Check if password is correct
    console.log('Verifying password...');
    const isPasswordCorrect = await user.correctPassword(password, user.password);
    console.log('Password correct:', isPasswordCorrect ? 'Yes' : 'No');
    
    if (!isPasswordCorrect) {
      const error = new AppError('Incorrect password', 401);
      if (next) return next(error);
      return res.status(401).json({
        status: 'error',
        message: error.message
      });
    }

    // 6) If everything ok, send token to client
    console.log('Login successful, generating token...');
    createSendToken(user, 200, req, res);
  } catch (err) {
    console.error('Login error:', err);
    if (next) {
      return next(err);
    }
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during login',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
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

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

// Reactivate a deactivated account
exports.reactivateAccount = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an email address'
      });
    }
    
    console.log('Attempting to reactivate account for email:', email);
    
    // Find the user (bypassing the active filter)
    const user = await User.findOne({ email: email.toLowerCase() })
      .setOptions({ skipMiddleware: true });
      
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No account found with this email address'
      });
    }
    
    console.log('Current account status:', user.active ? 'Active' : 'Inactive');
    
    // Reactivate the account
    user.active = true;
    await user.save({ validateBeforeSave: false });
    
    console.log('Account reactivated successfully');
    
    return res.status(200).json({
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
    console.error('Error in reactivateAccount:', err);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while reactivating the account',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
      return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, req, res);
  } catch (err) {
    next(err);
  }
};
