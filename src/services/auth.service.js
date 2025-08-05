const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const AppError = require('../utils/appError');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');

// Email service mock (replace with actual email service)
const Email = {
  async sendWelcome(email, username) {
    console.log(`Sending welcome email to ${email}`);
    return true;
  },
  async sendPasswordReset(email, resetUrl) {
    console.log(`Sending password reset to ${email}: ${resetUrl}`);
    return true;
  },
};

// Signup a new user
exports.signup = async (userData) => {
  try {
    console.log('Creating new user with data:', {
      username: userData.username,
      email: userData.email,
      hasPassword: !!userData.password,
      hasPasswordConfirm: !!userData.passwordConfirm
    });

    // Validate input
    if (!userData.username || !userData.email || !userData.password || !userData.passwordConfirm) {
      throw new Error('All fields are required');
    }

    if (userData.password !== userData.passwordConfirm) {
      throw new Error('Passwords do not match');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: userData.email },
        { username: userData.username }
      ]
    });

    if (existingUser) {
      if (existingUser.email === userData.email) {
        throw new Error('Email already in use');
      } else {
        throw new Error('Username already taken');
      }
    }

    const newUser = await User.create({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.passwordConfirm,
    });

    // Remove password from output
    newUser.password = undefined;

    // Send welcome email
    try {
      await Email.sendWelcome(newUser.email, newUser.username);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the signup if email fails
    }

    // Generate token
    const token = signToken(newUser._id);
    console.log('User created successfully:', newUser.email);

    return { user: newUser, token };
  } catch (error) {
    console.error('Error in auth service signup:', error);
    throw error; // Re-throw for the controller to handle
  }
};

// Login user
exports.login = async (email, password) => {
  try {
    // 1) Check if email and password exist
    if (!email || !password) {
      throw new AppError('Please provide email and password!', 400);
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new AppError('Incorrect email or password', 401);
    }

    // 3) Check if user is active
    if (!user.active) {
      throw new AppError('This account has been deactivated', 401);
    }

    // 4) If everything ok, send token to client
    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;

    return { user, token };
  } catch (error) {
    throw error;
  }
};

// Forgot password
exports.forgotPassword = async (email, resetUrl) => {
  try {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('There is no user with that email address.', 404);
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    const resetURL = `${resetUrl}/${resetToken}`;

    try {
      await Email.sendPasswordReset(user.email, resetURL);

      return { message: 'Token sent to email!' };
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      throw new AppError(
        'There was an error sending the email. Try again later!',
        500
      );
    }
  } catch (error) {
    throw error;
  }
};

// Reset password
exports.resetPassword = async (token, password, passwordConfirm) => {
  try {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      throw new AppError('Token is invalid or has expired', 400);
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user
    // This is handled in the user model pre-save middleware

    // 4) Log the user in, send JWT
    const authToken = signToken(user._id);

    return { token: authToken };
  } catch (error) {
    throw error;
  }
};

// Update password
exports.updatePassword = async (userId, currentPassword, newPassword, newPasswordConfirm) => {
  try {
    // 1) Get user from collection
    const user = await User.findById(userId).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(currentPassword, user.password))) {
      throw new AppError('Your current password is wrong.', 401);
    }

    // 3) If so, update password
    user.password = newPassword;
    user.passwordConfirm = newPasswordConfirm;
    await user.save();

    // 4) Log user in, send JWT
    const token = signToken(user._id);

    return { token };
  } catch (error) {
    throw error;
  }
};

// Protect routes - check if user is authenticated
exports.protect = async (token) => {
  try {
    // 1) Verify token
    if (!token) {
      throw new AppError('You are not logged in! Please log in to get access.', 401);
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, config.jwt.secret);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      throw new AppError('The user belonging to this token no longer exists.', 401);
    }

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      throw new AppError('User recently changed password! Please log in again.', 401);
    }

    return currentUser;
  } catch (error) {
    throw error;
  }
};

// Restrict to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array of allowed roles ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};
