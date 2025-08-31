require('dotenv').config();

const config = {
  // Server configuration
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 8000,
  
  // Database
  database: {
    // Ensure database name is included in the connection string
    url: (() => {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/acnh-quiz';
      
      // For MongoDB Atlas URLs, ensure database name is included
      if (uri.includes('mongodb+srv://') && !uri.includes('/acnh-quiz')) {
        // Add database name before query parameters
        if (uri.includes('?')) {
          return uri.replace('?', '/acnh-quiz?');
        } else {
          return `${uri}/acnh-quiz`;
        }
      }
      return uri;
    })(),
    // Options are now passed directly in the connection string
    // MongoDB driver 6.x handles SRV records automatically
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET environment variable is required for security') })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
    cookieExpiresIn: process.env.JWT_COOKIE_EXPIRES_IN || 90,
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : process.env.NODE_ENV === 'production' 
        ? ['https://blathers.app', 'https://www.blathers.app'] // Production only
        : ['http://localhost:3000', 'http://localhost:5501', 'http://127.0.0.1:5501', 'http://localhost:8000', 'https://acnhid.b-cdn.net', 'https://blathers.app'], // Development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
    maxAge: 86400, // 24 hours
  },
  
  // Security
  security: {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://acnhapi.com', 'https://acnhid.b-cdn.net', 'https://dodo.ac', '*'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'https://acnhapi.com', 'https://capstone-project-production-3cce.up.railway.app'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
  },
};

module.exports = config;
