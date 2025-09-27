const csrf = require('csurf');
const AppError = require('../utils/appError');

// Configure CSRF protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Middleware to handle CSRF errors
const handleCSRFError = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return next(new AppError('Invalid or missing CSRF token. Please try again.', 403));
  }
  next(err);
};

// Middleware to attach CSRF token to response locals for templates
const attachCSRFToken = (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
};

// Exempt certain routes from CSRF protection (like API endpoints with JWT auth)
const exemptFromCSRF = (req, res, next) => {
  // Skip CSRF for API routes that use JWT authentication
  if (
    req.path.startsWith('/api/') && 
    req.headers.authorization && 
    req.headers.authorization.startsWith('Bearer')
  ) {
    return next();
  }
  
  // Skip CSRF for auth endpoints (login, signup, etc.) - these don't have tokens yet
  if (req.path.startsWith('/api/v1/auth/')) {
    return next();
  }
  
  // Skip CSRF for public endpoints that use guest tokens
  if (
    req.path.startsWith('/api/leaderboard') && 
    (req.headers['x-guest-token'] || req.query.token)
  ) {
    return next();
  }
  
  // Skip CSRF for other public API endpoints
  if (req.path.startsWith('/api/v1/leaderboard') || 
      req.path.startsWith('/api/v1/game') ||
      req.path.startsWith('/api/v1/health')) {
    return next();
  }
  
  // Apply CSRF protection for all other routes
  return csrfProtection(req, res, next);
};

module.exports = {
  csrfProtection,
  handleCSRFError,
  attachCSRFToken,
  exemptFromCSRF
};
