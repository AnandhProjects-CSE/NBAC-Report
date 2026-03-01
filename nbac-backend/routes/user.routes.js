/**
 * User Routes
 * Admin-only routes for user management
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

/**
 * Validation rules
 */
const updateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('department')
    .optional()
    .trim()
    .notEmpty().withMessage('Department cannot be empty'),
  body('year')
    .optional()
    .isInt({ min: 1, max: 4 }).withMessage('Year must be between 1 and 4'),
  body('section')
    .optional()
    .trim()
    .isLength({ max: 5 }).withMessage('Section cannot exceed 5 characters'),
  body('rollNumber')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Roll number cannot exceed 20 characters')
];

const resetPasswordValidation = [
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const mongoIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid user ID format')
];

const courseIdValidation = [
  param('courseId')
    .isMongoId().withMessage('Invalid course ID format')
];

/**
 * All routes require authentication and admin role
 */
router.use(verifyToken);

/**
 * Routes accessible by both admin and faculty
 */

/**
 * @route   GET /api/users/students/unenrolled/:courseId
 * @desc    Get students not enrolled in a course
 * @access  Private (Faculty owner, Admin)
 */
router.get(
  '/students/unenrolled/:courseId',
  allowRoles('admin', 'faculty'),
  courseIdValidation,
  userController.getUnenrolledStudents
);

router.use(allowRoles('admin'));

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin)
 * @query   page, limit, role, department, isActive
 */
router.get('/', userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private (Admin)
 */
router.get('/:id', mongoIdValidation, userController.getUserById);

/**
 * @route   PATCH /api/users/:id
 * @desc    Update user
 * @access  Private (Admin)
 */
router.patch('/:id', mongoIdValidation, updateValidation, userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Soft delete user
 * @access  Private (Admin)
 */
router.delete('/:id', mongoIdValidation, userController.deleteUser);

/**
 * @route   POST /api/users/:id/restore
 * @desc    Restore deleted user
 * @access  Private (Admin)
 */
router.post('/:id/restore', mongoIdValidation, userController.restoreUser);

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (Admin)
 */
router.post(
  '/:id/reset-password',
  mongoIdValidation,
  resetPasswordValidation,
  userController.resetPassword
);



module.exports = router;
