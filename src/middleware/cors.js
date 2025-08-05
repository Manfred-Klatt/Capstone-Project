const { config } = require('../utils/env');

/**
 * CORS middleware with enhanced security
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Check if the origin is in the allowed list
    const allowedOrigins = config.cors.origin;
    const originIsAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');

    if (originIsAllowed) {
      return callback(null, true);
    }

    // Log unauthorized origins in development
    if (config.isDevelopment) {
      console.warn(`Blocked request from unauthorized origin: ${origin}`);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders,
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  credentials: config.cors.credentials,
  maxAge: 600, // 10 minutes
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

module.exports = corsOptions;
