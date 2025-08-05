const multer = require('multer');
const { AppError } = require('../utils');
const { config } = require('../utils/env');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploads.directory);
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `user-${uniqueSuffix}.${ext}`);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = config.uploads.allowedTypes;
  const ext = file.mimetype.split('/')[1];
  
  if (allowedTypes.includes(`.${ext}`)) {
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

// Configure multer with limits and file filter
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.uploads.maxFileSize,
  },
});

// Middleware to handle single file upload
const uploadSingle = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File size is too large', 400));
      }
      if (err instanceof multer.MulterError) {
        return next(new AppError('Error uploading file', 400));
      }
      return next(err);
    }
    next();
  });
};

// Middleware to handle multiple file uploads
const uploadMultiple = (fieldName, maxCount = 5) => (req, res, next) => {
  upload.array(fieldName, maxCount)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('One or more files are too large', 400));
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(
          new AppError(`Maximum ${maxCount} files are allowed`, 400)
        );
      }
      if (err instanceof multer.MulterError) {
        return next(new AppError('Error uploading files', 400));
      }
      return next(err);
    }
    next();
  });
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  upload,
};
