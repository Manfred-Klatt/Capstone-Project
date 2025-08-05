const compression = require('compression');
const { config } = require('../utils/env');

/**
 * Middleware to compress HTTP responses
 * @returns {Function} Compression middleware
 */
const compressResponse = () => {
  // Skip compression in test environment
  if (config.isTest) {
    return (req, res, next) => next();
  }

  return compression({
    // Only compress responses that exceed this size in bytes
    threshold: 1024,
    // Compression level (0-9, where 0 is no compression and 9 is maximum compression)
    level: 6,
    // Filter function to decide which responses to compress
    filter: (req, res) => {
      // Don't compress responses with cache-control set to no-transform
      if (res.getHeader('cache-control')?.includes('no-transform')) {
        return false;
      }

      // Don't compress responses that are already compressed
      if (res.getHeader('content-encoding') === 'gzip') {
        return false;
      }

      // Don't compress very small responses
      const size = parseInt(res.getHeader('content-length') || '0', 10);
      if (size > 0 && size < 1024) {
        return false;
      }

      // Don't compress responses that are already being streamed
      if (res._headerSent) {
        return false;
      }

      // Default to compressing the response
      return compression.filter(req, res);
    },
  });
};

module.exports = {
  compressResponse,
};
