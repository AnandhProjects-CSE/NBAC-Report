/**
 * User Controller
 * Handles user management operations (admin only)
 */

const User = require('../models/User.model');
const Course = require('../models/Course.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get all users with pagination and filtering
 * GET /api/users
 * Query params: page, limit, role, department
 */
const getAllUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, role, department, isActive } = req.query;
  
  // Build filter query
  const filter = {};
  
  if (role && ['admin', 'faculty', 'student'].includes(role)) {
    filter.role = role;
  }
  
  if (department) {
    filter.department = new RegExp(department, 'i');
  }
  
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }
  
  // Calculate pagination
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);
  
  // Execute query
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter)
  ]);
  
  const totalPages = Math.ceil(total / limitNum);
  
  return ApiResponse.paginated(res, 'Users retrieved successfully', users, {
    total,
    page: parseInt(page, 10),
    limit: limitNum,
    totalPages
  });
});

/**
 * Get single user by ID
 * GET /api/users/:id
 */
const getUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const user = await User.findById(id).select('-password -refreshToken');
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  // If user is faculty, get their courses count
  let additionalData = {};
  if (user.role === 'faculty') {
    const coursesCount = await Course.countDocuments({ facultyId: id, isActive: true });
    additionalData.coursesCount = coursesCount;
  }
  
  // If user is student, get their enrolled courses count
  if (user.role === 'student') {
    const enrolledCount = await Course.countDocuments({ 
      enrolledStudents: id, 
      isActive: true 
    });
    additionalData.enrolledCoursesCount = enrolledCount;
  }
  
  return ApiResponse.success(res, 200, 'User retrieved successfully', {
    user,
    ...additionalData
  });
});

/**
 * Update user
 * PATCH /api/users/:id
 */
const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, department, year, section, rollNumber, isActive, isApproved } = req.body;
  
  // Find user
  const user = await User.findById(id);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  // Check email change attempt
  if (req.body.email && req.body.email !== user.email) {
    throw ApiError.badRequest('Email cannot be changed');
  }
  
  // Check role change attempt
  if (req.body.role && req.body.role !== user.role) {
    throw ApiError.badRequest('Role cannot be changed after creation');
  }
  
  // Update fields
  if (name) user.name = name;
  if (department) user.department = department;
  if (user.role === 'student') {
    if (year !== undefined) user.year = year;
    if (section !== undefined) user.section = section.toUpperCase();
    if (rollNumber !== undefined) {
      // Check for duplicate roll number
      if (rollNumber) {
        const existingRoll = await User.findOne({ 
          rollNumber: rollNumber.toUpperCase(), 
          _id: { $ne: id } 
        });
        if (existingRoll) {
          throw ApiError.conflict('Roll number already exists');
        }
      }
      user.rollNumber = rollNumber ? rollNumber.toUpperCase() : undefined;
    }
  }
  
  if (isActive !== undefined) user.isActive = isActive;
  if (isApproved !== undefined) user.isApproved = isApproved;
  
  await user.save();
  
  return ApiResponse.success(res, 200, 'User updated successfully', {
    user: user.toSafeObject()
  });
});

/**
 * Soft delete user (set isActive: false)
 * DELETE /api/users/:id
 */
const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const user = await User.findById(id);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  // Prevent self-deletion
  if (req.userId.toString() === id) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }
  
  // Check if faculty has active courses
  if (user.role === 'faculty') {
    const activeCourses = await Course.countDocuments({ 
      facultyId: id, 
      isActive: true 
    });
    if (activeCourses > 0) {
      throw ApiError.badRequest(
        `Cannot deactivate faculty with ${activeCourses} active course(s). Reassign or delete courses first.`
      );
    }
  }
  
  // Soft delete
  user.isActive = false;
  user.refreshToken = null; // Clear any active sessions
  await user.save({ validateBeforeSave: false });
  
  return ApiResponse.success(res, 200, 'User deactivated successfully');
});

/**
 * Restore deleted user
 * POST /api/users/:id/restore
 */
const restoreUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const user = await User.findById(id);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  if (user.isActive) {
    throw ApiError.badRequest('User is already active');
  }
  
  user.isActive = true;
  await user.save({ validateBeforeSave: false });
  
  return ApiResponse.success(res, 200, 'User restored successfully', {
    user: user.toSafeObject()
  });
});

/**
 * Get unenrolled students for a course
 * GET /api/users/students/unenrolled/:courseId
 */
const getUnenrolledStudents = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const { year, section } = req.query;
  
  // Find the course
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  // Check ownership (faculty must be owner or admin)
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view students for your own courses');
  }
  
  // Build filter for students
  const filter = {
    role: 'student',
    isActive: true,
    department: course.department
  };
  
  // Optional filters
  if (year) filter.year = parseInt(year, 10);
  if (section) filter.section = section.toUpperCase();
  
  // Exclude already enrolled students
  if (course.enrolledStudents.length > 0) {
    filter._id = { $nin: course.enrolledStudents };
  }
  
  // Get unenrolled students
  const students = await User.find(filter)
    .select('name email rollNumber year section')
    .sort({ rollNumber: 1, name: 1 })
    .lean();
  
  return ApiResponse.success(res, 200, 'Unenrolled students retrieved', {
    course: {
      _id: course._id,
      courseCode: course.courseCode,
      courseName: course.courseName
    },
    students,
    count: students.length
  });
});

/**
 * Reset user password (admin only)
 * POST /api/users/:id/reset-password
 */
const resetPassword = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters');
  }
  
  const user = await User.findById(id);
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  
  user.password = newPassword;
  user.refreshToken = null; // Clear all sessions
  await user.save();
  
  return ApiResponse.success(res, 200, 'Password reset successfully');
});

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  restoreUser,
  getUnenrolledStudents,
  resetPassword
};
