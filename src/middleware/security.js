const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { config } = require('../utils/env');

// Security headers middleware
const securityHeaders = [
  // Prevent clickjacking
  (req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  },
  // Prevent MIME type sniffing
  (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  },
  // Enable XSS protection
  (req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  },
  // Set Referrer-Policy
  (req, res, next) => {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  },
  // Set Permissions-Policy
  (req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()'
    );
    next();
  },
];

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CSP configuration
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      'https://cdn.jsdelivr.net',
      'https://cdnjs.cloudflare.com',
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net',
      'https://cdnjs.cloudflare.com',
    ],
    fontSrc: [
      "'self'",
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net',
      'https://cdnjs.cloudflare.com',
    ],
    imgSrc: [
      "'self'",
      'data:',
      'blob:',
      'https://acnhapi.com',
      'https://acnhcdn.com',
    ],
    connectSrc: [
      "'self'",
      'https://acnhapi.com',
      'https://acnhcdn.com',
    ],
  },
};

// Security middleware
const securityMiddleware = [
  // Helmet security headers
  helmet({
    contentSecurityPolicy: config.isProduction ? cspConfig : false,
    crossOriginEmbedderPolicy: config.isProduction,
    crossOriginOpenerPolicy: config.isProduction,
    crossOriginResourcePolicy: { policy: 'same-site' },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 15552000, // 180 days in seconds
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  }),
  // Apply rate limiting to API routes
  (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return apiLimiter(req, res, next);
    }
    next();
  },
  // Additional security headers
  ...securityHeaders,
];

module.exports = securityMiddleware;
