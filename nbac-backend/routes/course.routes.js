/**
 * Course Routes
 * Handles course CRUD and enrollment
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const courseController = require('../controllers/course.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

/**
 * Validation rules
 */
const createCourseValidation = [
  body('courseCode')
    .trim()
    .notEmpty().withMessage('Course code is required')
    .isLength({ max: 20 }).withMessage('Course code cannot exceed 20 characters'),
  body('courseName')
    .trim()
    .notEmpty().withMessage('Course name is required')
    .isLength({ max: 200 }).withMessage('Course name cannot exceed 200 characters'),
  body('department')
    .trim()
    .notEmpty().withMessage('Department is required'),
  body('semester')
    .isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  body('academicYear')
    .matches(/^\d{4}-\d{2}$/).withMessage('Academic year must be in format YYYY-YY'),
  body('facultyId')
    .isMongoId().withMessage('Invalid faculty ID'),
  body('credits')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10'),
  body('enrolledStudents')
    .optional()
    .isArray().withMessage('Enrolled students must be an array')
];

const updateCourseValidation = [
  body('courseName')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Course name cannot exceed 200 characters'),
  body('semester')
    .optional()
    .isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  body('academicYear')
    .optional()
    .matches(/^\d{4}-\d{2}$/).withMessage('Academic year must be in format YYYY-YY'),
  body('facultyId')
    .optional()
    .isMongoId().withMessage('Invalid faculty ID'),
  body('credits')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Credits must be between 1 and 10')
];

const enrollValidation = [
  body('studentIds')
    .isArray({ min: 1 }).withMessage('Student IDs must be a non-empty array'),
  body('studentIds.*')
    .isMongoId().withMessage('Each student ID must be a valid MongoDB ID')
];

const mongoIdValidation = [
  param('id').isMongoId().withMessage('Invalid course ID format')
];

/**
 * All routes require authentication
 */
router.use(verifyToken);

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Private (Faculty, Admin)
 */
router.post(
  '/',
  allowRoles('faculty', 'admin'),
  createCourseValidation,
  courseController.createCourse
);

/**
 * @route   GET /api/courses
 * @desc    Get all courses (faculty sees own, admin sees all)
 * @access  Private (Faculty, Admin)
 */
router.get(
  '/',
  allowRoles('faculty', 'admin'),
  courseController.getAllCourses
);

/**
 * @route   GET /api/courses/student/my-courses
 * @desc    Get enrolled courses for student
 * @access  Private (Student)
 */
router.get(
  '/student/my-courses',
  allowRoles('student'),
  courseController.getStudentCourses
);

/**
 * @route   GET /api/courses/:id
 * @desc    Get single course
 * @access  Private (Faculty owner, Admin)
 */
router.get(
  '/:id',
  allowRoles('faculty', 'admin'),
  mongoIdValidation,
  courseController.getCourseById
);

/**
 * @route   PATCH /api/courses/:id
 * @desc    Update course
 * @access  Private (Faculty owner, Admin)
 */
router.patch(
  '/:id',
  allowRoles('faculty', 'admin'),
  mongoIdValidation,
  updateCourseValidation,
  courseController.updateCourse
);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete course (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  allowRoles('admin'),
  mongoIdValidation,
  courseController.deleteCourse
);

/**
 * @route   POST /api/courses/:id/enroll
 * @desc    Enroll students in course
 * @access  Private (Faculty owner, Admin)
 */
router.post(
  '/:id/enroll',
  allowRoles('faculty', 'admin'),
  mongoIdValidation,
  enrollValidation,
  courseController.enrollStudents
);

/**
 * @route   DELETE /api/courses/:id/enroll/:studentId
 * @desc    Remove student from course
 * @access  Private (Faculty owner, Admin)
 */
router.delete(
  '/:id/enroll/:studentId',
  allowRoles('faculty', 'admin'),
  [
    param('id').isMongoId().withMessage('Invalid course ID'),
    param('studentId').isMongoId().withMessage('Invalid student ID')
  ],
  courseController.removeStudent
);

module.exports = router;
