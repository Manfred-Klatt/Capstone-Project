const rateLimit = require('express-rate-limit');
const { createClient } = require('redis');
const { promisify } = require('util');
const { config } = require('../utils/env');
const { logger } = require('../utils');

// Redis client for distributed rate limiting in production
let redisClient;
let setExAsync;
let getAsync;

// Initialize Redis client if in production
if (config.isProduction) {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Too many retries on Redis connection. Exiting...');
            return new Error('Too many retries on Redis connection');
          }
          // Exponential backoff: 50, 100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600 ms
          return Math.min(retries * 50, 30000);
        },
      },
    });

    // Promisify Redis methods
    setExAsync = promisify(redisClient.setEx).bind(redisClient);
    getAsync = promisify(redisClient.get).bind(redisClient);

    // Handle Redis connection events
    redisClient.on('error', (err) => {
      logger.error(`Redis error: ${err.message}`);
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis for rate limiting');
    });

    // Connect to Redis
    redisClient.connect().catch((err) => {
      logger.error(`Failed to connect to Redis: ${err.message}`);
    });
  } catch (err) {
    logger.error(`Redis initialization error: ${err.message}`);
  }
}

/**
 * Create a rate limiter with Redis store for production and in-memory for development
 * @param {Object} options - Rate limiting options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests per window
 * @param {string} options.keyPrefix - Prefix for rate limit key
 * @param {string} options.message - Error message when rate limit is exceeded
 * @returns {Function} Rate limiter middleware
 */
const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 100, // limit each IP to 100 requests per windowMs
  keyPrefix = 'rl_',
  message = 'Too many requests from this IP, please try again later.',
} = {}) => {
  // In-memory store for development
  const store = {
    hits: new Map(),
    resetTime: Date.now() + windowMs,

    async increment(key) {
      if (Date.now() > this.resetTime) {
        this.hits.clear();
        this.resetTime = Date.now() + windowMs;
      }

      const counter = this.hits.get(key) || 0;
      this.hits.set(key, counter + 1);
      return { totalHits: counter + 1, resetTime: this.resetTime };
    },

    async decrement(key) {
      const counter = this.hits.get(key) || 0;
      if (counter > 0) {
        this.hits.set(key, counter - 1);
      }
    },

    resetKey(key) {
      this.hits.delete(key);
    },
  };

  // Redis store for production
  const redisStore = {
    async increment(key) {
      if (!redisClient || !redisClient.isReady) {
        throw new Error('Redis client not available');
      }

      const now = Date.now();
      const resetTimestamp = now + windowMs;
      const keyWithPrefix = `${keyPrefix}${key}`;

      try {
        // Get current counter
        const reply = await getAsync(keyWithPrefix);
        let counter = 1;
        let resetTime = resetTimestamp;

        if (reply) {
          const data = JSON.parse(reply);
          counter = data.counter + 1;
          resetTime = data.resetTime;
        }

        // Set or update the key with new counter and reset time
        await setExAsync(
          keyWithPrefix,
          Math.ceil(windowMs / 1000),
          JSON.stringify({ counter, resetTime })
        );

        return {
          totalHits: counter,
          resetTime,
        };
      } catch (err) {
        logger.error(`Redis error in rate limiter: ${err.message}`);
        // Fallback to in-memory store if Redis fails
        return store.increment(key);
      }
    },

    async decrement(key) {
      if (!redisClient || !redisClient.isReady) return;
      
      const keyWithPrefix = `${keyPrefix}${key}`;
      try {
        const reply = await getAsync(keyWithPrefix);
        if (reply) {
          const data = JSON.parse(reply);
          if (data.counter > 0) {
            await setExAsync(
              keyWithPrefix,
              Math.ceil((data.resetTime - Date.now()) / 1000),
              JSON.stringify({ ...data, counter: data.counter - 1 })
            );
          }
        }
      } catch (err) {
        logger.error(`Redis decrement error: ${err.message}`);
      }
    },

    resetKey(key) {
      if (!redisClient || !redisClient.isReady) return;
      const keyWithPrefix = `${keyPrefix}${key}`;
      redisClient.del(keyWithPrefix).catch((err) => {
        logger.error(`Failed to reset rate limit key: ${err.message}`);
      });
    },
  };

  return rateLimit({
    windowMs,
    max,
    message: { status: 'error', message },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req) => {
      // Use IP + user ID for authenticated users, just IP for anonymous
      return req.user ? `${req.user.id}:${req.ip}` : req.ip;
    },
    skip: (req) => {
      // Skip rate limiting for certain paths or users
      const skipPaths = ['/api/v1/health', '/api/v1/docs'];
      if (skipPaths.includes(req.path)) return true;
      if (req.user?.role === 'admin') return true;
      return false;
    },
    handler: (req, res, next, options) => {
      logger.warn(
        `Rate limit exceeded for ${req.ip} (user: ${req.user?.id || 'anonymous'}) at ${req.path}`
      );
      res.status(options.statusCode).json(options.message);
    },
    // Use Redis store in production, in-memory store in development
    store: config.isProduction ? redisStore : store,
  });
};

// Default rate limiter for API routes
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyPrefix: 'api_',
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Stricter rate limiter for auth routes
const authLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per hour
  keyPrefix: 'auth_',
  message: 'Too many login attempts, please try again after an hour',
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  // Export Redis client for other modules to use
  getRedisClient: () => redisClient,
};
