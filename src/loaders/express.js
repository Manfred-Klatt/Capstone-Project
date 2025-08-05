const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');
const { errorHandler, notFound } = require('../middleware/error');
const { httpLogger } = require('../middleware/logger');
const apiV1Routes = require('../api/v1');

const setupMiddleware = (app) => {
  // Request logging
  app.use(httpLogger);

  // Set security HTTP headers
  app.use(helmet(config.security.contentSecurityPolicy));

  // Implement CORS
  app.use(cors(config.cors));
  app.options('*', cors(config.cors));

  // Body parser, reading data from body into req.body
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use(hpp());

  // Compression
  app.use(compression());

  // Add request time and request ID
  app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    req.id = req.get('X-Request-Id') || require('crypto').randomUUID();
    next();
  });

  // Log all requests
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.id,
      timestamp: req.requestTime
    });
    next();
  });
};

const setupRoutes = (app) => {
  // API routes
  app.use('/api/v1', apiV1Routes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    logger.debug('Health check called', { requestId: req.id });
    res.status(200).json({
      status: 'success',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      env: process.env.NODE_ENV || 'development',
      requestId: req.id
    });
  });

  // Simple root route for development
  if (process.env.NODE_ENV !== 'production') {
    app.get('/', (req, res) => {
      res.json({
        status: 'success',
        message: 'Welcome to the Animal Crossing Quiz API',
        documentation: 'https://github.com/yourusername/animal-crossing-quiz#api-documentation',
        endpoints: {
          api: '/api/v1',
          health: '/health',
          apiDocs: '/api-docs' // If you have API documentation
        },
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    });
  }

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    // Set static folder
    app.use(express.static(path.join(__dirname, '../../client/build')));

    // Log static file serving in production
    app.use((req, res, next) => {
      logger.debug(`Serving static file: ${req.path}`, { requestId: req.id });
      next();
    });

    // Handle SPA
    app.get('*', (req, res) => {
      logger.debug(`SPA route accessed: ${req.path}`, { requestId: req.id });
      res.sendFile(path.resolve(__dirname, '../../client/build', 'index.html'));
    });
  }

  // Handle 404 - Must be after all other routes
  app.all('*', (req, res, next) => {
    const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    err.statusCode = 404;
    err.status = 'fail';
    next(err);
  });

  // Global error handler - Must be last
  app.use(errorHandler);
};

const createApp = () => {
  const app = express();
  
  // Setup middleware
  setupMiddleware(app);
  
  // Setup routes
  setupRoutes(app);
  
  return app;
};

module.exports = createApp;
