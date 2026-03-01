/**
 * CO-PO Matrix Routes
 * Handles matrix CRUD and Excel upload
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const { body, param } = require('express-validator');
const matrixController = require('../controllers/matrix.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const { uploadExcel, handleMulterError } = require('../middleware/upload.middleware');

/**
 * Validation rules
 */
const matrixValidation = [
  body('rows')
    .isArray({ min: 1 }).withMessage('Matrix rows must be a non-empty array'),
  body('rows.*.coId')
    .optional()
    .isMongoId().withMessage('Invalid CO ID'),
  body('rows.*.coNumber')
    .optional()
    .trim()
    .matches(/^CO[1-9]\d*$/i).withMessage('CO number must be in format CO1, CO2, etc.'),
  // PO values validation
  ...['po1', 'po2', 'po3', 'po4', 'po5', 'po6', 'po7', 'po8', 'po9', 'po10', 'po11', 'po12'].map(po =>
    body(`rows.*.${po}`)
      .optional()
      .isInt({ min: 0, max: 3 }).withMessage(`${po.toUpperCase()} must be 0, 1, 2, or 3`)
  )
];

const mongoIdValidation = [
  param('courseId').isMongoId().withMessage('Invalid course ID format')
];

/**
 * All routes require authentication
 */
router.use(verifyToken);

/**
 * @route   POST /api/courses/:courseId/matrix
 * @desc    Create or replace CO-PO matrix
 * @access  Private (Faculty owner, Admin)
 */
router.post(
  '/',
  allowRoles('faculty', 'admin'),
  mongoIdValidation,
  matrixValidation,
  matrixController.createMatrix
);

/**
 * @route   GET /api/courses/:courseId/matrix
 * @desc    Get CO-PO matrix for a course
 * @access  Private (Faculty, Admin)
 */
router.get(
  '/',
  allowRoles('faculty', 'admin'),
  mongoIdValidation,
  matrixController.getMatrix
);

/**
 * @route   POST /api/courses/:courseId/matrix/upload
 * @desc    Upload matrix via Excel file
 * @access  Private (Faculty owner, Admin)
 */
router.post(
  '/upload',
  allowRoles('faculty', 'admin'),
  mongoIdValidation,
  uploadExcel.single('file'),
  handleMulterError,
  matrixController.uploadMatrix
);

/**
 * @route   GET /api/courses/:courseId/matrix/template
 * @desc    Download matrix template
 * @access  Private (Faculty, Admin)
 */
router.get(
  '/template',
  allowRoles('faculty', 'admin'),
  mongoIdValidation,
  matrixController.getMatrixTemplate
);

module.exports = router;
