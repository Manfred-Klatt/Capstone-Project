const logger = require('../utils/logger');

/**
 * Middleware to log HTTP requests and responses
 */
const httpLogger = (req, res, next) => {
  // Skip health checks and static files
  if (req.path === '/health' || req.path.startsWith('/static')) {
    return next();
  }

  const start = Date.now();
  const { method, originalUrl, ip, headers } = req;
  const userAgent = headers['user-agent'] || '';
  const requestId = headers['x-request-id'] || 'none';

  // Log request details
  logger.info('Incoming request', {
    method,
    url: originalUrl,
    ip,
    userAgent,
    requestId,
    headers: process.env.NODE_ENV === 'development' ? headers : undefined
  });

  // Capture response finish event
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const contentLength = res.get('content-length') || 0;

    const logData = {
      method,
      url: originalUrl,
      status: statusCode,
      duration: `${duration}ms`,
      contentLength,
      requestId,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    };

    // Log at appropriate level based on status code
    if (statusCode >= 500) {
      logger.error('Request error', logData);
    } else if (statusCode >= 400) {
      logger.warn('Request warning', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

/**
 * Middleware to handle unhandled routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  // Log the error
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    status: statusCode,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.id || 'none'
  });

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack })
  });
};

module.exports = {
  httpLogger,
  notFoundHandler,
  errorHandler
};
