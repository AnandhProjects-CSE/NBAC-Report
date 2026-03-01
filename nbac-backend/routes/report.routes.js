/**
 * Report Routes
 * Handles NBA report generation
 */

const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');
const reportController = require('../controllers/report.controller');
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
 * @route   GET /api/reports/department
 * @desc    Get department-level NBA summary report
 * @access  Private (Admin)
 */
router.get(
  '/department',
  allowRoles('admin'),
  [
    query('department').optional().trim(),
    query('academicYear').optional().matches(/^\d{4}-\d{2}$/).withMessage('Invalid academic year format')
  ],
  reportController.getDepartmentReport
);

/**
 * @route   GET /api/reports/:courseId/co
 * @desc    Get CO attainment report data
 * @access  Private (Faculty owner, Admin)
 */
router.get(
  '/:courseId/co',
  allowRoles('faculty', 'admin'),
  courseIdValidation,
  reportController.getCOReport
);

/**
 * @route   GET /api/reports/:courseId/po
 * @desc    Get PO attainment report data
 * @access  Private (Faculty owner, Admin)
 */
router.get(
  '/:courseId/po',
  allowRoles('faculty', 'admin'),
  courseIdValidation,
  reportController.getPOReport
);

/**
 * @route   GET /api/reports/:courseId/full
 * @desc    Get full NBA report data
 * @access  Private (Faculty owner, Admin)
 */
router.get(
  '/:courseId/full',
  allowRoles('faculty', 'admin'),
  courseIdValidation,
  reportController.getFullReport
);

/**
 * @route   GET /api/reports/:courseId/export
 * @desc    Export report as JSON
 * @access  Private (Faculty owner, Admin)
 */
router.get(
  '/:courseId/export',
  allowRoles('faculty', 'admin'),
  courseIdValidation,
  reportController.exportReport
);

module.exports = router;
