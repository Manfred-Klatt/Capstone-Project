const auth = require('./auth');
const { validationErrorHandler, validate } = require('./validation');
const { uploadSingle, uploadMultiple } = require('./upload');
const { createRateLimiter, apiLimiter, authLimiter } = require('./rateLimit');
const { compressResponse } = require('./compression');
const requestLogger = require('./requestLogger');
const securityMiddleware = require('./security');
const corsOptions = require('./cors');

module.exports = {
  // Authentication & Authorization
  ...auth,
  
  // Validation
  validate,
  validationErrorHandler,
  
  // File Uploads
  uploadSingle,
  uploadMultiple,
  
  // Rate Limiting
  createRateLimiter,
  apiLimiter,
  authLimiter,
  
  // Compression
  compressResponse,
  
  // Logging
  requestLogger,
  
  // Security
  securityMiddleware,
  
  // CORS
  corsOptions,
};
