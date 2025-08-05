const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const AppError = require('./appError');

// Ensure upload directory exists
const createUploadsDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// Configure storage
const storage = (destination) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, createUploadsDir(destination));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });

// File filter
const fileFilter = (allowedTypes) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    return cb(null, true);
  }
  
  cb(
    new AppError(
      `Unsupported file type. Allowed types: ${allowedTypes.join(', ')}`,
      400
    ),
    false
  );
};

// File size limit (5MB)
const fileSizeLimit = 5 * 1024 * 1024; // 5MB

// Create upload middleware
const uploadFile = (options = {}) => {
  const {
    fieldName = 'file',
    destination = 'public/uploads',
    allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'],
    maxCount = 1,
  } = options;

  const upload = multer({
    storage: storage(destination),
    fileFilter: fileFilter(allowedTypes),
    limits: { fileSize: fileSizeLimit },
  });

  return maxCount === 1
    ? upload.single(fieldName)
    : upload.array(fieldName, maxCount);
};

// Delete file
const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${filePath}`, err);
      }
    });
  }
};

// Get file URL
const getFileUrl = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get('host')}/uploads/${path.basename(filename)}`;
};

module.exports = {
  uploadFile,
  deleteFile,
  getFileUrl,
};
