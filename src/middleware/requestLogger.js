const { logger } = require('../utils');

/**
 * Logs incoming requests with relevant details
 */
const requestLogger = (req, res, next) => {
  // Skip logging for health checks and static assets
  if (req.path === '/health' || req.path.startsWith('/static')) {
    return next();
  }

  const start = Date.now();
  const { method, originalUrl, ip, headers } = req;

  // Log request start
  logger.info(`[${method}] ${originalUrl} - IP: ${ip} - Started`);

  // Log request body (except for sensitive data)
  if (Object.keys(req.body).length > 0 && !['/api/v1/auth/login', '/api/v1/auth/signup'].includes(req.path)) {
    logger.debug('Request body:', {
      body: req.body,
    });
  }

  // Log query parameters if present
  if (Object.keys(req.query).length > 0) {
    logger.debug('Query parameters:', {
      query: req.query,
    });
  }

  // Log response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const contentLength = res.get('content-length');

    const logData = {
      method,
      url: originalUrl,
      status: statusCode,
      duration: `${duration}ms`,
      contentLength: contentLength || '0',
      ip,
      userAgent: headers['user-agent'] || '',
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

module.exports = requestLogger;
