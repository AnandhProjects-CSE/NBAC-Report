/**
 * File Upload Middleware
 * Configures Multer for Excel file uploads
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/apiError');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const uploadPath = path.resolve(__dirname, '..', uploadDir);

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

/**
 * Multer storage configuration
 * Files are stored temporarily and deleted after processing
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

/**
 * File filter - only allow Excel files
 */
const excelFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'application/excel',
    'application/x-excel',
    'application/x-msexcel'
  ];
  
  const allowedExtensions = ['.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ApiError.badRequest(
      'Invalid file type. Only Excel files (.xlsx, .xls) are allowed.'
    ), false);
  }
};

/**
 * Parse file size from environment
 */
const getMaxFileSize = () => {
  const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5;
  return maxSizeMB * 1024 * 1024; // Convert to bytes
};

/**
 * Multer upload instance for single Excel file
 */
const uploadExcel = multer({
  storage,
  fileFilter: excelFileFilter,
  limits: {
    fileSize: getMaxFileSize(),
    files: 1
  }
});

/**
 * Multer upload instance for multiple files (if needed)
 */
const uploadMultiple = multer({
  storage,
  fileFilter: excelFileFilter,
  limits: {
    fileSize: getMaxFileSize(),
    files: 5
  }
});

/**
 * Error handler for Multer errors
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        const maxSizeMB = process.env.MAX_FILE_SIZE_MB || 5;
        return next(ApiError.badRequest(
          `File too large. Maximum size allowed is ${maxSizeMB}MB.`
        ));
      case 'LIMIT_FILE_COUNT':
        return next(ApiError.badRequest('Too many files uploaded.'));
      case 'LIMIT_UNEXPECTED_FILE':
        return next(ApiError.badRequest('Unexpected file field.'));
      case 'LIMIT_FIELD_KEY':
        return next(ApiError.badRequest('Field name too long.'));
      case 'LIMIT_FIELD_VALUE':
        return next(ApiError.badRequest('Field value too long.'));
      case 'LIMIT_FIELD_COUNT':
        return next(ApiError.badRequest('Too many form fields.'));
      case 'LIMIT_PART_COUNT':
        return next(ApiError.badRequest('Too many parts in form.'));
      default:
        return next(ApiError.badRequest(`File upload error: ${err.message}`));
    }
  }
  
  // Not a Multer error, pass to next error handler
  next(err);
};

/**
 * Clean up uploaded file after processing
 * Call this in controllers after file is processed
 */
const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Error cleaning up file:', err.message);
    }
  }
};

/**
 * Middleware to clean up file on error
 */
const cleanupOnError = (err, req, res, next) => {
  if (req.file) {
    cleanupFile(req.file.path);
  }
  if (req.files) {
    if (Array.isArray(req.files)) {
      req.files.forEach(file => cleanupFile(file.path));
    } else {
      Object.values(req.files).forEach(files => {
        files.forEach(file => cleanupFile(file.path));
      });
    }
  }
  next(err);
};

module.exports = {
  uploadExcel,
  uploadMultiple,
  handleMulterError,
  cleanupFile,
  cleanupOnError
};
