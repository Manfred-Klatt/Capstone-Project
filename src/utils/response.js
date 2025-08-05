/**
 * Success response handler
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Response data
 * @param {Object} metadata - Additional metadata
 */
const successResponse = (
  res,
  statusCode = 200,
  message = 'Success',
  data = null,
  metadata = {}
) => {
  const response = {
    status: 'success',
    message,
    ...metadata,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response handler
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Array} errors - Array of error objects
 */
const errorResponse = (
  res,
  statusCode = 500,
  message = 'Internal Server Error',
  errors = []
) => {
  const response = {
    status: 'error',
    message,
  };

  if (errors.length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Pagination metadata generator
 * @param {Object} req - Express request object
 * @param {number} total - Total number of items
 * @param {number} limit - Items per page
 * @param {number} page - Current page
 * @returns {Object} Pagination metadata
 */
const getPaginationMetadata = (req, total, limit, page) => {
  const totalPages = Math.ceil(total / limit);
  const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
  
  const metadata = {
    total,
    totalPages,
    currentPage: page,
    itemsPerPage: limit,
  };

  if (page < totalPages) {
    metadata.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
  }

  if (page > 1) {
    metadata.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
  }

  return metadata;
};

module.exports = {
  successResponse,
  errorResponse,
  getPaginationMetadata,
};
