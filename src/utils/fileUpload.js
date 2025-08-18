const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const AppError = require('./appError');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common image formats and documents
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /image\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain/.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new AppError('Only image files, PDFs, and documents are allowed', 400));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});

/**
 * Upload a file to the server
 * @param {Object} file - The file object from multer
 * @param {string} destination - Destination folder (optional, defaults to uploads)
 * @returns {Promise<string>} - File path
 */
const uploadFile = async (file, destination = 'uploads') => {
  try {
    if (!file) {
      throw new AppError('No file provided', 400);
    }

    // If file is already saved by multer, return the path
    if (file.path) {
      return file.path.replace(process.cwd(), '').replace(/\\/g, '/');
    }

    // Handle buffer uploads (memory storage)
    if (file.buffer) {
      const uploadDir = path.join(process.cwd(), destination);
      await fs.mkdir(uploadDir, { recursive: true });

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
      const filepath = path.join(uploadDir, filename);

      await fs.writeFile(filepath, file.buffer);
      return path.join(destination, filename).replace(/\\/g, '/');
    }

    throw new AppError('Invalid file object', 400);
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

    const fullPath = path.isAbsolute(filepath) ? filepath : path.join(process.cwd(), filepath);
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

  // Normalize path separators and ensure it starts with /
  const normalizedPath = filepath.replace(/\\/g, '/');
  return normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
};

module.exports = {
  upload,
  uploadFile,
  deleteFile,
  getFileUrl,
};
