/**
 * Marks Routes
 * Handles marks upload and management
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const { body, param, query } = require('express-validator');
const marksController = require('../controllers/marks.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');
const { uploadExcel, handleMulterError } = require('../middleware/upload.middleware');

/**
 * Validation rules
 */
const mongoIdValidation = [
  param('courseId').isMongoId().withMessage('Invalid course ID format'),
  param('marksId').optional().isMongoId().withMessage('Invalid marks ID format')
];

/**
 * All routes require authentication
 */
router.use(verifyToken);

/**
 * @route   POST /api/courses/:courseId/marks/upload
 * @desc    Upload marks via Excel file
 * @access  Private (Faculty owner, Admin)
 */
router.post(
  '/upload',
  allowRoles('faculty', 'admin'),
  mongoIdValidation,
  uploadExcel.single('file'),
  handleMulterError,
  [
    body('assessmentType')
      .isIn(['internal1', 'internal2', 'assignment', 'external'])
      .withMessage('Assessment type must be internal1, internal2, assignment, or external')
  ],
  marksController.uploadMarks
);

/**
 * @route   GET /api/courses/:courseId/marks
 * @desc    Get all marks records for a course
 * @access  Private (Faculty owner, Admin)
 */
router.get(
  '/',
  allowRoles('faculty', 'admin'),
  mongoIdValidation,
  marksController.getAllMarks
);

/**
 * @route   GET /api/courses/:courseId/marks/template
 * @desc    Download marks upload template
 * @access  Private (Faculty, Admin)
 */
router.get(
  '/template',
  allowRoles('faculty', 'admin'),
  mongoIdValidation,
  marksController.getMarksTemplate
);

/**
 * @route   GET /api/courses/:courseId/marks/summary
 * @desc    Get student-wise marks summary
 * @access  Private (Faculty owner, Admin)
 */
router.get(
  '/summary',
  allowRoles('faculty', 'admin'),
  mongoIdValidation,
  marksController.getMarksSummary
);

/**
 * @route   GET /api/courses/:courseId/marks/:marksId
 * @desc    Get specific marks record
 * @access  Private (Faculty owner, Admin)
 */
router.get(
  '/:marksId',
  allowRoles('faculty', 'admin'),
  mongoIdValidation,
  marksController.getMarksById
);

/**
 * @route   DELETE /api/courses/:courseId/marks/:marksId
 * @desc    Delete a marks record
 * @access  Private (Faculty owner, Admin)
 */
router.delete(
  '/:marksId',
  allowRoles('faculty', 'admin'),
  mongoIdValidation,
  marksController.deleteMarks
);

module.exports = router;
