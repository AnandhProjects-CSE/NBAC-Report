/**
 * Feedback Routes
 * Handles student feedback submission and retrieval
 */

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const feedbackController = require('../controllers/feedback.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

/**
 * Validation rules
 */
const feedbackValidation = [
  body('responses')
    .isArray({ min: 1 }).withMessage('Responses must be a non-empty array'),
  body('responses.*.coId')
    .isMongoId().withMessage('Each CO ID must be a valid MongoDB ID'),
  body('responses.*.rating')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Comments cannot exceed 500 characters')
];

const courseIdValidation = [
  param('courseId').isMongoId().withMessage('Invalid course ID format')
];

/**
 * All routes require authentication
 */
router.use(verifyToken);

/**
 * @route   GET /api/feedback/student/status
 * @desc    Get feedback status for all enrolled courses (student)
 * @access  Private (Student)
 */
router.get(
  '/student/status',
  allowRoles('student'),
  feedbackController.getStudentFeedbackStatus
);

/**
 * @route   POST /api/feedback/:courseId
 * @desc    Submit feedback for a course
 * @access  Private (Student - enrolled)
 */
router.post(
  '/:courseId',
  allowRoles('student'),
  courseIdValidation,
  feedbackValidation,
  feedbackController.submitFeedback
);

/**
 * @route   GET /api/feedback/:courseId/status
 * @desc    Check if student has submitted feedback for a course
 * @access  Private (Student - enrolled)
 */
router.get(
  '/:courseId/status',
  allowRoles('student'),
  courseIdValidation,
  feedbackController.getFeedbackStatusForCourse
);

/**
 * @route   GET /api/feedback/:courseId
 * @desc    Get all feedback for a course
 * @access  Private (Faculty owner, Admin)
 */
router.get(
  '/:courseId',
  allowRoles('faculty', 'admin'),
  courseIdValidation,
  feedbackController.getCourseFeedback
);

/**
 * @route   GET /api/feedback/:courseId/summary
 * @desc    Get aggregated feedback summary for a course
 * @access  Private (Faculty owner, Admin)
 */
router.get(
  '/:courseId/summary',
  allowRoles('faculty', 'admin'),
  courseIdValidation,
  feedbackController.getFeedbackSummary
);

module.exports = router;
