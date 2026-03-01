/**
 * Authentication Routes
 * Public routes for login, register, refresh
 * Protected routes for logout, profile
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

/**
 * Validation rules for registration
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['admin', 'faculty', 'student']).withMessage('Invalid role'),
  body('department')
    .trim()
    .notEmpty().withMessage('Department is required'),
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

/**
 * Validation rules for login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

/**
 * Validation rules for refresh token
 */
const refreshValidation = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required')
];

/**
 * Validation rules for profile update
 */
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (admin only)
 * @access  Private (Admin)
 */
router.post(
  '/register',
  verifyToken,
  allowRoles('admin'),
  registerValidation,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshValidation, authController.refreshAccessToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', verifyToken, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', verifyToken, authController.getCurrentUser);

/**
 * @route   PATCH /api/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch('/me', verifyToken, updateProfileValidation, authController.updateProfile);

module.exports = router;
