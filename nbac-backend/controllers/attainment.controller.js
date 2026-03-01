/**
 * Attainment Controller
 * Handles CO and PO attainment calculation and retrieval
 */

const Course = require('../models/Course.model');
const Attainment = require('../models/Attainment.model');
const attainmentService = require('../services/attainment.service');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Trigger attainment calculation for a course
 * POST /api/attainment/:courseId/calculate
 */
const calculateCourseAttainment = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only calculate attainment for your own courses');
  }
  
  try {
    // Calculate attainment
    const { attainment, warnings } = await attainmentService.calculateAttainment(
      courseId,
      req.userId
    );
    
    // Populate for response
    await attainment.populate('generatedBy', 'name email');
    await attainment.populate('coAttainments.coId', 'coNumber description');
    
    return ApiResponse.success(res, 200, 'Attainment calculated successfully', {
      attainment: {
        _id: attainment._id,
        courseId: attainment.courseId,
        coAttainments: attainment.coAttainments,
        poAttainments: attainment.poAttainments,
        generatedAt: attainment.generatedAt,
        generatedBy: attainment.generatedBy,
        summary: attainment.summary
      },
      warnings: warnings.length > 0 ? warnings : undefined
    });
  } catch (error) {
    // Handle known calculation errors
    if (error.message.includes('No Course Outcomes') ||
        error.message.includes('Marks not uploaded') ||
        error.message.includes('CO-PO matrix not defined')) {
      throw ApiError.badRequest(error.message);
    }
    throw error;
  }
});

/**
 * Get attainment results for a course
 * GET /api/attainment/:courseId
 */
const getCourseAttainment = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view attainment for your own courses');
  }
  
  // Get attainment
  const attainment = await attainmentService.getAttainment(courseId);
  
  if (!attainment) {
    return ApiResponse.success(res, 200, 'No attainment data found for this course', {
      attainment: null,
      message: 'Trigger calculation to generate attainment data'
    });
  }

  console.log(" The attainment received : ",attainment)
  return ApiResponse.success(res, 200, 'Attainment data retrieved', {
    attainment: {
      _id: attainment._id,
      courseId: attainment.courseId,
      coAttainments: attainment.coAttainments,
      poAttainments: attainment.poAttainments,
      generatedAt: attainment.generatedAt,
      generatedBy: attainment.generatedBy,
      warnings: attainment.warnings,
      summary: attainment.summary
    }
  });
});

/**
 * Get department-level PO attainment summary
 * GET /api/attainment/department/summary
 */
const getDepartmentSummary = asyncHandler(async (req, res, next) => {
  const { department, academicYear } = req.query;
  
  // Get user's department
  const userDepartment = department || req.user.department;
  
  if (!userDepartment) {
    throw ApiError.badRequest('Department is required');
  }
  
  // Only admin can view other departments
  if (req.user.role === 'admin' && department && department !== req.user.department) {
    // Admin can view any department - allowed
  } else if (req.user.role === 'faculty' && department && department !== req.user.department) {
    throw ApiError.forbidden('You can only view your own department summary');
  }
  
  const summary = await attainmentService.getDepartmentSummary(userDepartment, academicYear);
  
  return ApiResponse.success(res, 200, 'Department summary retrieved', {
    department: userDepartment,
    academicYear: academicYear || 'All years',
    ...summary
  });
});

/**
 * Clear attainment data for a course (admin only)
 * DELETE /api/attainment/:courseId
 */
const clearCourseAttainment = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  // Check course exists
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  // Clear attainment
  const cleared = await attainmentService.clearAttainment(courseId);
  
  if (!cleared) {
    return ApiResponse.success(res, 200, 'No attainment data to clear');
  }
  
  return ApiResponse.success(res, 200, 'Attainment data cleared successfully');
});

/**
 * Get CO attainment comparison across assessments
 * GET /api/attainment/:courseId/co-comparison
 */
const getCOComparison = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view attainment for your own courses');
  }
  
  // Get attainment
  const attainment = await attainmentService.getAttainment(courseId);
  
  if (!attainment) {
    throw ApiError.notFound('No attainment data found. Calculate attainment first.');
  }
  
  // Format for comparison chart
  const coComparison = attainment.coAttainments.map(co => ({
    coNumber: co.coNumber,
    description: co.description,
    directAttainment: co.directAttainment,
    indirectAttainment: co.indirectAttainment,
    finalAttainment: co.finalAttainment,
    successPercentage: co.successPercentage
  }));
  
  return ApiResponse.success(res, 200, 'CO comparison data retrieved', {
    coComparison
  });
});

/**
 * Get PO attainment chart data
 * GET /api/attainment/:courseId/po-chart
 */
const getPOChart = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view attainment for your own courses');
  }
  
  // Get attainment
  const attainment = await attainmentService.getAttainment(courseId);
  
  if (!attainment) {
    throw ApiError.notFound('No attainment data found. Calculate attainment first.');
  }
  
  // Format for chart
  const poChart = attainment.poAttainments.map(po => ({
    poNumber: po.poNumber,
    poName: po.poName,
    attainmentValue: po.attainmentValue,
    level: getAttainmentLevel(po.attainmentValue),
    contributingCOs: po.contributingCOs
  }));
  
  return ApiResponse.success(res, 200, 'PO chart data retrieved', {
    poChart
  });
});

/**
 * Get attainment level description
 */
const getAttainmentLevel = (value) => {
  if (value === null) return 'N/A';
  if (value >= 2.5) return 'High';
  if (value >= 1.5) return 'Medium';
  if (value >= 0.5) return 'Low';
  return 'Very Low';
};

module.exports = {
  calculateCourseAttainment,
  getCourseAttainment,
  getDepartmentSummary,
  clearCourseAttainment,
  getCOComparison,
  getPOChart
};
