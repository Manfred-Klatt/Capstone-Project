const AppError = require('../utils/appError');
const logger = require('../utils/logger');

// Handle MongoDB cast errors (invalid ID format)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle MongoDB duplicate field errors
const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue ? Object.values(err.keyValue)[0] : 'unknown';
  const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
  const message = `Duplicate ${field} value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// Handle MongoDB validation errors
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// Development error response
const sendErrorDev = (err, req, res) => {
  // Log the error
  logger.error('Development Error:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    status: err.status,
    error: err,
    requestId: req.id,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
      requestId: req.id,
    });
  }
  
  // B) Rendered website
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
    requestId: req.id,
  });
};

// Production error response
const sendErrorProd = (err, req, res) => {
  // Log the error
  if (err.isOperational) {
    logger.error('Operational Error:', {
      message: err.message,
      statusCode: err.statusCode,
      status: err.status,
      requestId: req.id,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.error('Programming or Unknown Error:', {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      status: err.status,
      requestId: req.id,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        requestId: req.id,
      });
    }
    // B) Programming or other unknown error: don't leak error details
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
      requestId: req.id,
    });
  }

  // B) Rendered website
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
      requestId: req.id,
    });
  }
  // B) Programming or other unknown error: don't leak error details
  return res.status(500).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
    requestId: req.id,
  });
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  try {
    // Set default values if not set
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    // Handle specific error types
    let error = { ...err };
    error.message = err.message;
    
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    
    // Log the error
    const errorContext = {
      statusCode: error.statusCode,
      status: error.status,
      name: error.name,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.id,
      originalError: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        ...(error.errors && { errors: error.errors })
      }
    };
    
    logger.error(error.message, errorContext);
    
    // In development, send detailed error information
    if (process.env.NODE_ENV === 'development') {
      return sendErrorDev(error, req, res);
    }
    
    // In production, send a generic error message
    return sendErrorProd(error, req, res);
    
  } catch (errorHandlerError) {
    // If something goes wrong in the error handler itself
    console.error('Critical error in error handler:', {
      originalError: {
        message: err?.message,
        stack: err?.stack,
        name: err?.name
      },
      handlerError: {
        message: errorHandlerError.message,
        stack: errorHandlerError.stack
      },
      request: {
        id: req.id,
        method: req.method,
        path: req.path,
        ip: req.ip
      }
    });
    
    // Fallback response
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred',
      requestId: req.id,
    });
  }
};

// Catch async/await errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error('Async error caught by catchAsync:', err);
      next(err);
    });
  };
};

// 404 Not Found handler
const notFound = (req, res, next) => {
  logger.warn('404 Not Found', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.id,
  });
  
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
};

// Export all error handling utilities
module.exports = {
  AppError,
  errorHandler,
  catchAsync,
  notFound,
  handleCastErrorDB,
  handleDuplicateFieldsDB,
  handleValidationErrorDB,
  handleJWTError,
  handleJWTExpiredError
};
