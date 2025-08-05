const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./appError');

// Load environment variables from .env file
dotenv.config();

// Define required environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'JWT_COOKIE_EXPIRES_IN',
  'CORS_ORIGIN',
];

// Check for missing required environment variables
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new AppError(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`,
    500
  );
}

// Environment configuration
const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';
const isDevelopment = env === 'development';
const isTest = env === 'test';

// Application configuration
const config = {
  env,
  isProduction,
  isDevelopment,
  isTest,
  port: parseInt(process.env.PORT, 10) || 8000,
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
    cookieExpiresIn: parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) || 90,
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // limit each IP to 100 requests per windowMs
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@ac-quiz.com',
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  },
  uploads: {
    directory: process.env.UPLOADS_DIRECTORY || 'public/uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['.jpg', '.jpeg', '.png', '.gif'],
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
};

// Ensure uploads directory exists
const ensureUploadsDir = () => {
  if (!fs.existsSync(config.uploads.directory)) {
    fs.mkdirSync(config.uploads.directory, { recursive: true });
  }
};

// Initialize required directories
const initDirectories = () => {
  ensureUploadsDir();
};

module.exports = {
  config,
  initDirectories,
};
