/**
 * Course Outcome (CO) Controller
 * Handles CO CRUD operations for courses
 */

const Course = require('../models/Course.model');
const CourseOutcome = require('../models/CourseOutcome.model');
const Marks = require('../models/Marks.model');
const Attainment = require('../models/Attainment.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Add a CO to a course
 * POST /api/courses/:courseId/cos
 */
const addCO = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const { coNumber, description, threshold } = req.body;
  
  // Validate required fields
  if (!coNumber || !description) {
    throw ApiError.badRequest('CO number and description are required');
  }
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
 if (req.user.role === 'faculty') {
  const courseFacultyId = course.facultyId.toString();
  if (courseFacultyId !== req.userId.toString()) {
    throw ApiError.forbidden('You can only view COs for your own courses');
  }
}
  
  // Format CO number
  const formattedCONumber = coNumber.toUpperCase();
  
  // Validate CO number format
  if (!/^CO[1-9]\d*$/.test(formattedCONumber)) {
    throw ApiError.badRequest('CO number must be in format CO1, CO2, CO3, etc.');
  }
  
  // Check if CO already exists
  const existingCO = await CourseOutcome.findOne({
    courseId,
    coNumber: formattedCONumber
  });
  
  if (existingCO) {
    throw ApiError.conflict(`${formattedCONumber} already exists for this course`);
  }
  
  // Create CO
  const co = await CourseOutcome.create({
    courseId,
    coNumber: formattedCONumber,
    description,
    threshold: threshold !== undefined ? threshold : 60
  });
  
  return ApiResponse.created(res, 'Course Outcome added successfully', { co });
});

/**
 * Get all COs for a course
 * GET /api/courses/:courseId/cos
 */
const getAllCOs = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view COs for your own courses');
  }
  
  // Get COs
  const cos = await CourseOutcome.findByCourse(courseId);
  
  return ApiResponse.success(res, 200, 'Course Outcomes retrieved successfully', {
    course: {
      _id: course._id,
      courseCode: course.courseCode,
      courseName: course.courseName
    },
    cos,
    count: cos.length
  });
});

/**
 * Get single CO
 * GET /api/courses/:courseId/cos/:coId
 */
const getCOById = asyncHandler(async (req, res, next) => {
  const { courseId, coId } = req.params;
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view COs for your own courses');
  }
  
  // Get CO
  const co = await CourseOutcome.findOne({ _id: coId, courseId });
  
  if (!co) {
    throw ApiError.notFound('Course Outcome not found');
  }
  
  return ApiResponse.success(res, 200, 'Course Outcome retrieved', { co });
});

/**
 * Update a CO
 * PATCH /api/courses/:courseId/cos/:coId
 */
const updateCO = asyncHandler(async (req, res, next) => {
  const { courseId, coId } = req.params;
  const { description, threshold } = req.body;
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only update COs for your own courses');
  }
  
  // Find CO
  const co = await CourseOutcome.findOne({ _id: coId, courseId });
  
  if (!co) {
    throw ApiError.notFound('Course Outcome not found');
  }
  
  // Update fields
  if (description !== undefined) co.description = description;
  if (threshold !== undefined) {
    if (threshold < 0 || threshold > 100) {
      throw ApiError.badRequest('Threshold must be between 0 and 100');
    }
    co.threshold = threshold;
  }
  
  await co.save();
  
  return ApiResponse.success(res, 200, 'Course Outcome updated successfully', { co });
});

/**
 * Delete a CO
 * DELETE /api/courses/:courseId/cos/:coId
 */
const deleteCO = asyncHandler(async (req, res, next) => {
  const { courseId, coId } = req.params;
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only delete COs from your own courses');
  }
  
  // Find CO
  const co = await CourseOutcome.findOne({ _id: coId, courseId });
  
  if (!co) {
    throw ApiError.notFound('Course Outcome not found');
  }
  
  // Check if CO can be deleted
  const { canDelete, reason } = await co.canDelete();
  
  if (!canDelete) {
    throw ApiError.conflict(`Cannot delete CO: ${reason}`);
  }
  
  // Delete CO
  await CourseOutcome.findByIdAndDelete(coId);
  
  return ApiResponse.success(res, 200, 'Course Outcome deleted successfully');
});

/**
 * Batch create COs
 * POST /api/courses/:courseId/cos/batch
 */
const batchCreateCOs = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const { cos } = req.body;
  
  if (!cos || !Array.isArray(cos) || cos.length === 0) {
    throw ApiError.badRequest('COs array is required');
  }
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only add COs to your own courses');
  }
  
  // Validate and format COs
  const formattedCOs = [];
  const errors = [];
  
  for (let i = 0; i < cos.length; i++) {
    const { coNumber, description, threshold } = cos[i];
    
    if (!coNumber || !description) {
      errors.push({ index: i, message: 'CO number and description are required' });
      continue;
    }
    
    const formattedCONumber = coNumber.toUpperCase();
    
    if (!/^CO[1-9]\d*$/.test(formattedCONumber)) {
      errors.push({ index: i, message: `Invalid CO number format: ${coNumber}` });
      continue;
    }
    
    formattedCOs.push({
      courseId,
      coNumber: formattedCONumber,
      description,
      threshold: threshold !== undefined ? threshold : 60
    });
  }
  
  if (formattedCOs.length === 0) {
    throw ApiError.badRequest('No valid COs provided', errors);
  }
  
  // Check for duplicates within batch
  const coNumbersInBatch = formattedCOs.map(c => c.coNumber);
  const duplicatesInBatch = coNumbersInBatch.filter(
    (item, index) => coNumbersInBatch.indexOf(item) !== index
  );
  
  if (duplicatesInBatch.length > 0) {
    throw ApiError.badRequest(
      `Duplicate CO numbers in batch: ${[...new Set(duplicatesInBatch)].join(', ')}`
    );
  }
  
  // Check for existing COs in database
  const existingCOs = await CourseOutcome.find({
    courseId,
    coNumber: { $in: coNumbersInBatch }
  }).select('coNumber');
  
  if (existingCOs.length > 0) {
    const existingNumbers = existingCOs.map(c => c.coNumber).join(', ');
    throw ApiError.conflict(`The following COs already exist: ${existingNumbers}`);
  }
  
  // Insert all COs
  const insertedCOs = await CourseOutcome.insertMany(formattedCOs);
  
  return ApiResponse.created(res, 'Course Outcomes created successfully', {
    cos: insertedCOs,
    count: insertedCOs.length,
    errors: errors.length > 0 ? errors : undefined
  });
});

module.exports = {
  addCO,
  getAllCOs,
  getCOById,
  updateCO,
  deleteCO,
  batchCreateCOs
};
