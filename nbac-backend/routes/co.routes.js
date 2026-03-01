/**
 * Course Outcome (CO) Routes
 * Handles CO CRUD for courses
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const { body, param } = require('express-validator');
const coController = require('../controllers/co.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

/**
 * Validation rules
 */
const coValidation = [
  body('coNumber')
    .trim()
    .notEmpty().withMessage('CO number is required')
    .matches(/^CO[1-9]\d*$/i).withMessage('CO number must be in format CO1, CO2, etc.'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('threshold')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Threshold must be between 0 and 100')
];

const updateCOValidation = [
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('threshold')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Threshold must be between 0 and 100')
];

const batchCOValidation = [
  body('cos')
    .isArray({ min: 1 }).withMessage('COs must be a non-empty array'),
  body('cos.*.coNumber')
    .trim()
    .notEmpty().withMessage('CO number is required')
    .matches(/^CO[1-9]\d*$/i).withMessage('CO number must be in format CO1, CO2, etc.'),
  body('cos.*.description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('cos.*.threshold')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Threshold must be between 0 and 100')
];

const mongoIdValidation = [
  param('courseId').isMongoId().withMessage('Invalid course ID format'),
  param('coId').optional().isMongoId().withMessage('Invalid CO ID format')
];

/**
 * All routes require authentication
 */
router.use(verifyToken);

/**
 * @route   POST /api/courses/:courseId/cos
 * @desc    Add a CO to a course
 * @access  Private (Faculty owner, Admin)
 */
router.post(
  '/',
  allowRoles('faculty', 'admin'),
  coValidation,
  coController.addCO
);

/**
 * @route   POST /api/courses/:courseId/cos/batch
 * @desc    Batch create COs
 * @access  Private (Faculty owner, Admin)
 */
router.post(
  '/batch',
  allowRoles('faculty', 'admin'),
  batchCOValidation,
  coController.batchCreateCOs
);

/**
 * @route   GET /api/courses/:courseId/cos
 * @desc    Get all COs for a course
 * @access  Private (Faculty, Admin)
 */
router.get(
  '/',
  allowRoles('faculty', 'admin'),
  [param('courseId').isMongoId().withMessage('Invalid course ID format')],
  coController.getAllCOs
);

/**
 * @route   GET /api/courses/:courseId/cos/:coId
 * @desc    Get single CO
 * @access  Private (Faculty, Admin)
 */
router.get(
  '/:coId',
  allowRoles('faculty', 'admin'),
  mongoIdValidation,
  coController.getCOById
);

/**
 * @route   PATCH /api/courses/:courseId/cos/:coId
 * @desc    Update a CO
 * @access  Private (Faculty owner, Admin)
 */
router.patch(
  '/:coId',
  allowRoles('faculty', 'admin'),
  mongoIdValidation,
  updateCOValidation,
  coController.updateCO
);

/**
 * @route   DELETE /api/courses/:courseId/cos/:coId
 * @desc    Delete a CO
 * @access  Private (Faculty owner, Admin)
 */
router.delete(
  '/:coId',
  allowRoles('faculty', 'admin'),
  mongoIdValidation,
  coController.deleteCO
);

module.exports = router;
