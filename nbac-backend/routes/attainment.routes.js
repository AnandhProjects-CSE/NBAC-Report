/**
 * Attainment Routes
 * Handles CO and PO attainment calculations and retrieval
 */

const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');
const attainmentController = require('../controllers/attainment.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

/**
 * Validation rules
 */
const courseIdValidation = [
  param('courseId').isMongoId().withMessage('Invalid course ID format')
];

/**
 * All routes require authentication
 */
router.use(verifyToken);

/**
 * @route   GET /api/attainment/department/summary
 * @desc    Get department-level PO attainment summary
 * @access  Private (Admin)
 */
router.get(
  '/department/summary',
  allowRoles('admin'),
  [
    query('department').optional().trim(),
    query('academicYear').optional().matches(/^\d{4}-\d{2}$/).withMessage('Invalid academic year format')
  ],
  attainmentController.getDepartmentSummary
);

/**
 * @route   POST /api/attainment/:courseId/calculate
 * @desc    Trigger attainment calculation for a course
 * @access  Private (Faculty owner, Admin)
 */
router.post(
  '/:courseId/calculate',
  allowRoles('faculty', 'admin'),
  courseIdValidation,
  attainmentController.calculateCourseAttainment
);

/**
 * @route   GET /api/attainment/:courseId
 * @desc    Get attainment results for a course
 * @access  Private (Faculty, Admin)
 */
router.get(
  '/:courseId',
  allowRoles('faculty', 'admin'),
  courseIdValidation,
  attainmentController.getCourseAttainment
);

/**
 * @route   DELETE /api/attainment/:courseId
 * @desc    Clear attainment data for a course
 * @access  Private (Admin)
 */
router.delete(
  '/:courseId',
  allowRoles('admin'),
  courseIdValidation,
  attainmentController.clearCourseAttainment
);

/**
 * @route   GET /api/attainment/:courseId/co-comparison
 * @desc    Get CO attainment comparison data
 * @access  Private (Faculty owner, Admin)
 */
router.get(
  '/:courseId/co-comparison',
  allowRoles('faculty', 'admin'),
  courseIdValidation,
  attainmentController.getCOComparison
);

/**
 * @route   GET /api/attainment/:courseId/po-chart
 * @desc    Get PO attainment chart data
 * @access  Private (Faculty owner, Admin)
 */
router.get(
  '/:courseId/po-chart',
  allowRoles('faculty', 'admin'),
  courseIdValidation,
  attainmentController.getPOChart
);

module.exports = router;
