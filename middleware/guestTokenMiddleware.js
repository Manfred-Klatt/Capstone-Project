/**
 * Guest Token Authentication Middleware
 * 
 * This middleware allows public access to certain endpoints using a guest token
 * for authentication instead of requiring a full user login.
 */

const AppError = require('../utils/appError');

/**
 * Middleware to authenticate requests using guest tokens
 * @param {string} tokenType - The type of guest token to check (e.g., 'leaderboard', 'image')
 */
exports.authenticateWithGuestToken = (tokenType) => {
  return (req, res, next) => {
    try {
      // Skip if user is already authenticated
      if (req.user) {
        return next();
      }
      
      // Get the guest token from headers or query params
      const guestToken = req.headers['x-guest-token'] || req.query.token;
      
      if (!guestToken) {
        return next(new AppError('Guest token is required for access', 401));
      }
      
      // Get the appropriate environment variable based on token type
      let validToken;
      switch (tokenType) {
        case 'leaderboard':
          validToken = process.env.GUEST_LEADERBOARD_TOKEN || 'a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9';
          break;
        case 'image':
          validToken = process.env.GUEST_IMAGE_TOKEN || 'a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9';
          break;
        default:
          return next(new AppError('Invalid token type specified', 500));
      }
      
      // Validate the token
      if (guestToken !== validToken) {
        return next(new AppError('Invalid guest token', 401));
      }
      
      // Mark the request as guest authenticated
      req.isGuestAuthenticated = true;
      req.guestTokenType = tokenType;
      
      next();
    } catch (error) {
      console.error('Guest token authentication error:', error);
      next(new AppError('Authentication failed', 401));
    }
  };
};

/**
 * Middleware that allows access if the user is authenticated OR has a valid guest token
 * @param {string} tokenType - The type of guest token to check
 */
exports.allowWithGuestToken = (tokenType) => {
  return (req, res, next) => {
    // If user is already authenticated via JWT, proceed
    if (req.user) {
      return next();
    }
    
    // Otherwise, check for guest token
    exports.authenticateWithGuestToken(tokenType)(req, res, next);
  };
};
