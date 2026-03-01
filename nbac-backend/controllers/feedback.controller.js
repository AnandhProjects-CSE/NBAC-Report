/**
 * Feedback Controller
 * Handles student feedback submission and retrieval
 */

const Course = require('../models/Course.model');
const CourseOutcome = require('../models/CourseOutcome.model');
const Feedback = require('../models/Feedback.model');
const User = require('../models/User.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Submit feedback for a course (student only)
 * POST /api/feedback/:courseId
 */
const submitFeedback = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const { responses, comments } = req.body;
  
  // Only students can submit feedback
  if (req.user.role !== 'student') {
    throw ApiError.forbidden('Only students can submit feedback');
  }
  
  // Validate responses
  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    throw ApiError.badRequest('Feedback responses are required');
  }
  
  // Check course exists and is active
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (!course.isActive) {
    throw ApiError.badRequest('Cannot submit feedback for inactive course');
  }
  
  // Check student is enrolled
  if (!course.isStudentEnrolled(req.userId)) {
    throw ApiError.forbidden('You are not enrolled in this course');
  }
  
  // Check if already submitted
  const alreadySubmitted = await Feedback.hasSubmitted(courseId, req.userId);
  if (alreadySubmitted) {
    throw ApiError.conflict('You have already submitted feedback for this course');
  }
  
  // Get COs for this course
  const cos = await CourseOutcome.findByCourse(courseId);
  const coMap = new Map(cos.map(co => [co._id.toString(), co]));
  
  // Validate and format responses
  const formattedResponses = [];
  const errors = [];
  
  for (let i = 0; i < responses.length; i++) {
    const { coId, rating } = responses[i];
    
    if (!coId) {
      errors.push({ index: i, message: 'CO ID is required' });
      continue;
    }
    
    // Validate CO belongs to this course
    const co = coMap.get(coId.toString());
    if (!co) {
      errors.push({ index: i, message: 'Invalid CO ID for this course' });
      continue;
    }
    
    // Validate rating
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      errors.push({ index: i, message: 'Rating must be an integer between 1 and 5' });
      continue;
    }
    
    formattedResponses.push({
      coId,
      coNumber: co.coNumber,
      rating
    });
  }
  
  if (formattedResponses.length === 0) {
    throw ApiError.badRequest('No valid feedback responses', errors);
  }
  
  // Create feedback
  const feedback = await Feedback.create({
    courseId,
    studentId: req.userId,
    responses: formattedResponses,
    comments: comments || undefined
  });
  
  return ApiResponse.created(res, 'Feedback submitted successfully', {
    feedback: {
      _id: feedback._id,
      submittedAt: feedback.submittedAt,
      totalCOs: formattedResponses.length
    },
    warnings: errors.length > 0 ? errors : undefined
  });
});

/**
 * Get all feedback for a course (faculty/admin only)
 * GET /api/feedback/:courseId
 */
const getCourseFeedback = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view feedback for your own courses');
  }
  
  // Check if user is student - they shouldn't see other feedbacks
  if (req.user.role === 'student') {
    throw ApiError.forbidden('Students cannot view all feedback');
  }
  
  // Calculate pagination
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);
  
  // Get feedbacks
  const [feedbacks, total] = await Promise.all([
    Feedback.find({ courseId })
      .populate('studentId', 'name rollNumber')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Feedback.countDocuments({ courseId })
  ]);
  
  const totalPages = Math.ceil(total / limitNum);
  
  // Anonymize student info if needed (for reports)
  const anonymizedFeedbacks = feedbacks.map(f => ({
    _id: f._id,
    student: {
      rollNumber: f.studentId?.rollNumber || 'Anonymous'
    },
    responses: f.responses,
    submittedAt: f.submittedAt,
    comments: f.comments
  }));
  
  return ApiResponse.paginated(res, 'Feedback retrieved successfully', anonymizedFeedbacks, {
    total,
    page: parseInt(page, 10),
    limit: limitNum,
    totalPages
  });
});

/**
 * Get aggregated feedback summary for a course
 * GET /api/feedback/:courseId/summary
 */
const getFeedbackSummary = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view feedback for your own courses');
  }
  
  if (req.user.role === 'student') {
    throw ApiError.forbidden('Students cannot view feedback summary');
  }
  
  // Get COs
  const cos = await CourseOutcome.findByCourse(courseId);
  
  // Get feedback summary
  const summary = await Feedback.getSummaryByCourse(courseId);
  
  // Get total submissions
  const totalSubmissions = await Feedback.countDocuments({ courseId });
  
  // Calculate overall average rating
  let overallRating = 0;
  if (summary.length > 0) {
    const totalRatings = summary.reduce((sum, s) => sum + s.averageRating, 0);
    overallRating = (totalRatings / summary.length).toFixed(2);
  }
  
  return ApiResponse.success(res, 200, 'Feedback summary retrieved', {
    course: {
      _id: course._id,
      courseCode: course.courseCode,
      courseName: course.courseName
    },
    totalSubmissions,
    totalEnrolled: course.enrolledStudents.length,
    overallAverageRating: parseFloat(overallRating),
    coWiseSummary: summary,
    responseRate: course.enrolledStudents.length > 0 
      ? ((totalSubmissions / course.enrolledStudents.length) * 100).toFixed(1) 
      : 0
  });
});

/**
 * Get feedback status for student's courses
 * GET /api/feedback/student/status
 */
const getStudentFeedbackStatus = asyncHandler(async (req, res, next) => {
  // Only for students
  if (req.user.role !== 'student') {
    throw ApiError.forbidden('This endpoint is for students only');
  }
  
  // Get enrolled courses
  const courses = await Course.find({
    enrolledStudents: req.userId,
    isActive: true
  })
    .populate('facultyId', 'name email')
    .select('courseCode courseName semester academicYear facultyId')
    .lean();
  
  if (courses.length === 0) {
    return ApiResponse.success(res, 200, 'No enrolled courses found', {
      courses: [],
      summary: { total: 0, submitted: 0, pending: 0 }
    });
  }
  
  const courseIds = courses.map(c => c._id);
  
  // Get feedback status
  const feedbackStatus = await Feedback.getStudentFeedbackStatus(req.userId, courseIds);
  
  // Combine course info with status
  const coursesWithStatus = courses.map(course => {
    const isSubmitted = feedbackStatus.submittedCourseIds.has(course._id.toString());
    const submission = feedbackStatus.submitted.find(
      s => s.courseId.toString() === course._id.toString()
    );
    
    return {
      _id: course._id,
      courseCode: course.courseCode,
      courseName: course.courseName,
      semester: course.semester,
      academicYear: course.academicYear,
      faculty: course.facultyId,
      feedbackStatus: isSubmitted ? 'submitted' : 'pending',
      submittedAt: submission?.submittedAt || null
    };
  });
  
  return ApiResponse.success(res, 200, 'Feedback status retrieved', {
    courses: coursesWithStatus,
    summary: {
      total: courses.length,
      submitted: feedbackStatus.submitted.length,
      pending: feedbackStatus.pendingCourseIds.length
    }
  });
});

/**
 * Check if student has submitted feedback for a course
 * GET /api/feedback/:courseId/status
 */
const getFeedbackStatusForCourse = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  // Only for students
  if (req.user.role !== 'student') {
    throw ApiError.forbidden('This endpoint is for students only');
  }
  
  // Check enrollment
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (!course.isStudentEnrolled(req.userId)) {
    throw ApiError.forbidden('You are not enrolled in this course');
  }
  
  // Check feedback status
  const hasSubmitted = await Feedback.hasSubmitted(courseId, req.userId);
  
  let feedback = null;
  let cos = null;
  
  if (hasSubmitted) {
    feedback = await Feedback.findOne({ courseId, studentId: req.userId })
      .select('submittedAt responses.coNumber responses.rating')
      .lean();
  } else {
    // If not submitted, fetch COs so student can see what to rate
    cos = await CourseOutcome.findByCourse(courseId);
    cos = cos.map(co => ({
      _id: co._id,
      coNumber: co.coNumber,
      description: co.description
    }));
  }
  
  return ApiResponse.success(res, 200, 'Feedback status retrieved', {
    courseId,
    courseCode: course.courseCode,
    courseName: course.courseName,
    hasSubmitted,
    feedback: feedback ? {
      submittedAt: feedback.submittedAt,
      responses: feedback.responses
    } : null,
    cos: cos || null
  });
});

module.exports = {
  submitFeedback,
  getCourseFeedback,
  getFeedbackSummary,
  getStudentFeedbackStatus,
  getFeedbackStatusForCourse
};
