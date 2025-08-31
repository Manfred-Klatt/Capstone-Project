/**
 * CORS Test Controller
 * 
 * Provides endpoints to test CORS configuration
 */

const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/appError');

/**
 * Test endpoint that requires guest token authentication
 */
exports.testGuestToken = catchAsync(async (req, res, next) => {
  // Check for guest token header
  const guestToken = req.headers['x-guest-token'];
  
  if (!guestToken) {
    return next(new AppError('Guest token is required', 401));
  }
  
  // Check if token matches environment variable (in a real app, use secure comparison)
  const validToken = process.env.GUEST_LEADERBOARD_TOKEN || 'a7b9c2d5e8f3g6h1j4k7m2n5p8r3t6v9';
  
  if (guestToken !== validToken) {
    return next(new AppError('Invalid guest token', 401));
  }
  
  // Return success response with headers information
  res.status(200).json({
    status: 'success',
    message: 'CORS test with guest token successful',
    requestHeaders: {
      'x-guest-token': req.headers['x-guest-token'] ? 'present' : 'missing',
      'x-csrf-token': req.headers['x-csrf-token'] ? 'present' : 'missing',
      'content-type': req.headers['content-type'],
      'accept': req.headers['accept'],
      'origin': req.headers['origin'],
      'referer': req.headers['referer']
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Test endpoint for preflight requests
 */
exports.testPreflight = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: 'CORS preflight test successful',
    method: req.method,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

/**
 * Test endpoint for CSRF token
 */
exports.testCSRF = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: 'CSRF test successful',
    csrfToken: req.csrfToken ? req.csrfToken() : 'CSRF function not available',
    timestamp: new Date().toISOString()
  });
});
