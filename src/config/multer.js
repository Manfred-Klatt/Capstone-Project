const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AppError = require('../utils/appError');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/avatars');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `user-${uuidv4()}${ext}`);
  },
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const filetypes = /jpe?g|png|gif/;
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (filetypes.test(extname) && filetypes.test(mimetype)) {
    return cb(null, true);
  }
  
  cb(
    new AppError('Only image files are allowed (jpg, jpeg, png, gif)', 400),
    false
  );
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = { upload };
