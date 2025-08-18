const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const AppError = require('./appError');

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow common image formats
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed', 400));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

/**
 * Upload a file to the server
 * @param {Object} file - The file object from multer
 * @param {string} destination - Destination folder
 * @returns {Promise<string>} - File path
 */
const uploadFile = async (file, destination = 'uploads') => {
  try {
    if (!file) {
      throw new AppError('No file provided', 400);
    }

    // Create destination directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), destination);
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    const filepath = path.join(uploadDir, filename);

    // Write file to disk
    await fs.writeFile(filepath, file.buffer);

    return path.join(destination, filename);
  } catch (error) {
    throw new AppError(`File upload failed: ${error.message}`, 500);
  }
};

/**
 * Delete a file from the server
 * @param {string} filepath - Path to the file to delete
 * @returns {Promise<boolean>} - Success status
 */
const deleteFile = async (filepath) => {
  try {
    if (!filepath) {
      return false;
    }

    const fullPath = path.join(process.cwd(), filepath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    // File might not exist, which is okay
    return false;
  }
};

/**
 * Get public URL for a file
 * @param {string} filepath - Path to the file
 * @returns {string} - Public URL
 */
const getFileUrl = (filepath) => {
  if (!filepath) {
    return null;
  }

  // For local development, return relative path
  // In production, you might want to use a CDN or cloud storage URL
  return `/${filepath.replace(/\\/g, '/')}`;
};

module.exports = {
  upload,
  uploadFile,
  deleteFile,
  getFileUrl,
};
