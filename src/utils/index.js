const APIFeatures = require('./apiFeatures');
const AppError = require('./appError');
const { catchAsync } = require('../middleware/error');
const logger = require('./logger');
const { validate, validateRequest } = require('./validation');
const { successResponse, errorResponse, getPaginationMetadata } = require('./response');
const { uploadFile, deleteFile, getFileUrl } = require('./fileUpload');
const {
  formatDate,
  getDateDiff,
  addTime,
  isPast,
  isFuture,
  startOf,
  endOf,
  moment,
} = require('./dateTime');

module.exports = {
  // Core utilities
  APIFeatures,
  AppError,
  catchAsync,
  logger,
  
  // Validation
  validate,
  validateRequest,
  
  // Response handling
  successResponse,
  errorResponse,
  getPaginationMetadata,
  
  // File handling
  uploadFile,
  deleteFile,
  getFileUrl,
  
  // Date and time
  formatDate,
  getDateDiff,
  addTime,
  isPast,
  isFuture,
  startOf,
  endOf,
  moment,
};
