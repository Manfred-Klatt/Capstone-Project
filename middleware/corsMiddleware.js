const cors = require('cors');
const config = require('../src/config');

// Custom CORS middleware to handle preflight requests properly
const customCorsMiddleware = (req, res, next) => {
  // Set CORS headers for preflight requests
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Guest-Token, X-CSRF-Token, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie, Content-Length, X-CSRF-Token');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Continue to the next middleware
  next();
};

// Create configured CORS middleware
const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Get allowed origins from environment or config
    const configOrigins = config.cors.origin || [];
    const envOrigin = process.env.CORS_ORIGIN;
    
    // Combine origins from different sources
    let allowedOrigins = [...configOrigins];
    
    // Add environment-specific origin if available
    if (envOrigin) {
      // Handle comma-separated list of origins
      const envOrigins = envOrigin.split(',').map(o => o.trim());
      allowedOrigins = [...allowedOrigins, ...envOrigins];
    }
    
    // Always allow blathers.app in production
    if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT_NAME) {
      allowedOrigins.push('https://blathers.app');
      allowedOrigins.push('https://www.blathers.app');
    }
    
    // Log allowed origins in debug mode
    if (process.env.LOG_LEVEL === 'debug') {
      console.log('CORS allowed origins:', allowedOrigins);
      console.log('Request origin:', origin);
    }
    
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Token', 'X-CSRF-Token', 'Accept'],
  exposedHeaders: ['Set-Cookie', 'Content-Length', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
});

module.exports = {
  customCorsMiddleware,
  corsMiddleware
};
