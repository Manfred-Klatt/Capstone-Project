const express = require('express');
const { upload, uploadFile, deleteFile, getFileUrl } = require('../../../utils/fileUpload');
const { successResponse, errorResponse } = require('../../../utils/response');
const { catchAsync } = require('../../../middleware/error');

const router = express.Router();

/**
 * @route POST /api/v1/upload/single
 * @desc Upload a single file
 * @access Public (you may want to add authentication middleware)
 */
router.post('/single', upload.single('file'), catchAsync(async (req, res) => {
  if (!req.file) {
    return errorResponse(res, 'No file uploaded', 400);
  }

  const filePath = await uploadFile(req.file);
  const fileUrl = getFileUrl(filePath);

  successResponse(res, {
    message: 'File uploaded successfully',
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: filePath,
      url: fileUrl
    }
  }, 201);
}));

/**
 * @route POST /api/v1/upload/multiple
 * @desc Upload multiple files
 * @access Public (you may want to add authentication middleware)
 */
router.post('/multiple', upload.array('files', 5), catchAsync(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return errorResponse(res, 'No files uploaded', 400);
  }

  const uploadedFiles = await Promise.all(
    req.files.map(async (file) => {
      const filePath = await uploadFile(file);
      const fileUrl = getFileUrl(filePath);
      
      return {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: filePath,
        url: fileUrl
      };
    })
  );

  successResponse(res, {
    message: `${uploadedFiles.length} files uploaded successfully`,
    data: uploadedFiles
  }, 201);
}));

/**
 * @route DELETE /api/v1/upload/:filename
 * @desc Delete a file
 * @access Public (you may want to add authentication middleware)
 */
router.delete('/:filename', catchAsync(async (req, res) => {
  const { filename } = req.params;
  const filePath = `uploads/${filename}`;
  
  const deleted = await deleteFile(filePath);
  
  if (deleted) {
    successResponse(res, {
      message: 'File deleted successfully'
    });
  } else {
    errorResponse(res, 'File not found or could not be deleted', 404);
  }
}));

module.exports = router;
