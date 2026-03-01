/**
 * Authentication Controller
 * Handles user registration, login, logout, and token refresh
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Generate access and refresh tokens for a user
 * @param {Object} user - User document
 * @returns {Object} Access and refresh tokens
 */
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
  
  return { accessToken, refreshToken };
};

/**
 * Register a new user
 * Only admins can register new users
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, department, year, section, rollNumber } = req.body;
  
  // Validate required fields
  if (!name || !email || !password || !role || !department) {
    throw ApiError.badRequest('Please provide all required fields');
  }
  
  // Validate role-specific fields
  if (role === 'student') {
    if (!year || !section) {
      throw ApiError.badRequest('Year and section are required for students');
    }
  }
  
  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw ApiError.conflict('User with this email already exists');
  }
  
  // Check if roll number already exists (for students)
  if (rollNumber) {
    const existingRollNumber = await User.findOne({ rollNumber: rollNumber.toUpperCase() });
    if (existingRollNumber) {
      throw ApiError.conflict('User with this roll number already exists');
    }
  }
  
  // Create user data
  const userData = {
    name,
    email: email.toLowerCase(),
    password,
    role,
    department,
    isApproved: true // Auto-approve since admin is registering
  };
  
  // Add student-specific fields
  if (role === 'student') {
    userData.year = year;
    userData.section = section.toUpperCase();
    if (rollNumber) {
      userData.rollNumber = rollNumber.toUpperCase();
    }
  }
  
  // Create user
  const user = await User.create(userData);
  
  // Return success without tokens (admin registers, user logs in separately)
  return ApiResponse.created(res, 'User registered successfully', {
    user: user.toSafeObject()
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    throw ApiError.badRequest('Please provide email and password');
  }
  
  // Find user with password
  const user = await User.findByEmailWithPassword(email.toLowerCase());
  
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  
  // Check if user is active
  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact administrator.');
  }
  
  // Check if user is approved
  if (!user.isApproved) {
    throw ApiError.forbidden('Your account is pending approval. Please contact administrator.');
  }
  
  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);
  
  // Save refresh token to database
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  
  // Return response
  return ApiResponse.success(res, 200, 'Login successful', {
    accessToken,
    refreshToken,
    user: user.toSafeObject()
  });
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshAccessToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw ApiError.badRequest('Refresh token is required');
  }
  
  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Refresh token expired. Please login again.');
    }
    throw ApiError.unauthorized('Invalid refresh token. Please login again.');
  }
  
  // Find user
  const user = await User.findById(decoded.userId).select('+refreshToken');
  
  if (!user) {
    throw ApiError.unauthorized('User not found. Please login again.');
  }
  
  // Verify stored refresh token matches
  if (user.refreshToken !== refreshToken) {
    throw ApiError.unauthorized('Invalid refresh token. Token may have been revoked.');
  }
  
  // Check if user is active
  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated.');
  }
  
  // Generate new tokens
  const tokens = generateTokens(user);
  
  // Update refresh token in database
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });
  
  return ApiResponse.success(res, 200, 'Token refreshed successfully', {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  });
});

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res, next) => {
  // Get user from request (attached by verifyToken middleware)
  const user = await User.findById(req.userId).select('+refreshToken');
  
  if (user) {
    // Clear refresh token
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
  }
  
  return ApiResponse.success(res, 200, 'Logged out successfully');
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getCurrentUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  return ApiResponse.success(res, 200, 'User profile retrieved', {
    user: user.toSafeObject()
  });
});

/**
 * Update current user profile (limited fields)
 * PATCH /api/auth/me
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, password } = req.body;
  
  const user = await User.findById(req.userId);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  // Update allowed fields
  if (name) user.name = name;
  if (password) user.password = password;
  
  await user.save();
  
  return ApiResponse.success(res, 200, 'Profile updated successfully', {
    user: user.toSafeObject()
  });
});

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  getCurrentUser,
  updateProfile
};
