/**
 * Course Controller
 * Handles course CRUD and enrollment operations
 */

const Course = require('../models/Course.model');
const User = require('../models/User.model');
const CourseOutcome = require('../models/CourseOutcome.model');
const POMatrix = require('../models/POMatrix.model');
const Marks = require('../models/Marks.model');
const Attainment = require('../models/Attainment.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Create a new course
 * POST /api/courses
 */
const createCourse = asyncHandler(async (req, res, next) => {
  const { 
    courseCode, 
    courseName, 
    department, 
    semester, 
    academicYear, 
    facultyId,
    credits,
    description,
    enrolledStudents 
  } = req.body;
  
  // Validate required fields
  if (!courseCode || !courseName || !department || !semester || !academicYear) {
    throw ApiError.badRequest('Missing required fields');
  }
  
  // Determine facultyId - if faculty is creating, use their own ID
  let actualFacultyId = facultyId;
  if (req.user.role === 'faculty') {
    actualFacultyId = req.userId;
  } else if (req.user.role === 'admin' && !facultyId) {
    throw ApiError.badRequest('Faculty ID is required');
  }
  
  // Verify faculty exists and is a faculty
  const faculty = await User.findOne({ _id: actualFacultyId, role: 'faculty', isActive: true });
  if (!faculty) {
    throw ApiError.notFound('Faculty not found or inactive');
  }
  
  // Check if THIS faculty already has this exact course in same semester/year
  // (different faculty CAN create the same course)
  const existingCourse = await Course.findOne({
    courseCode: courseCode.toUpperCase(),
    department,
    semester,
    academicYear,
    facultyId: actualFacultyId
  });
  
  if (existingCourse) {
    throw ApiError.conflict('You already have a course with this code for the given semester and academic year');
  }
  
  // Validate enrolled students if provided
  let validStudents = [];
  if (enrolledStudents && enrolledStudents.length > 0) {
    const students = await User.find({
      _id: { $in: enrolledStudents },
      role: 'student',
      isActive: true
    }).select('_id');
    
    validStudents = students.map(s => s._id);
  }
  
  // Create course
  const course = await Course.create({
    courseCode: courseCode.toUpperCase(),
    courseName,
    department,
    semester,
    academicYear,
    facultyId: actualFacultyId,
    credits: credits || 3,
    description,
    enrolledStudents: validStudents
  });
  
  await course.populate('facultyId', 'name email department');
  
  return ApiResponse.created(res, 'Course created successfully', {
    course,
    enrolledCount: validStudents.length
  });
});

/**
 * Get all courses with pagination and filtering
 * GET /api/courses
 */
const getAllCourses = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 20, 
    semester, 
    academicYear, 
    department,
    facultyId,
    isActive,
    search
  } = req.query;
  
  const filter = {};
  
  // Faculty can only see their own courses
  if (req.user.role === 'faculty') {
    filter.facultyId = req.userId;
  } else if (facultyId) {
    filter.facultyId = facultyId;
  }
  
  if (semester) filter.semester = parseInt(semester, 10);
  if (academicYear) filter.academicYear = academicYear;
  if (department) filter.department = new RegExp(department, 'i');
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  // Search by course code or course name
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { courseCode: searchRegex },
      { courseName: searchRegex }
    ];
  }
  
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);
  
  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate('facultyId', 'name email department')
      .populate('enrolledStudents', 'name rollNumber year section')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Course.countDocuments(filter)
  ]);
  
  const totalPages = Math.ceil(total / limitNum);
  
  return ApiResponse.paginated(res, 'Courses retrieved successfully', courses, {
    total,
    page: parseInt(page, 10),
    limit: limitNum,
    totalPages
  });
});

/**
 * Get single course by ID with full details
 * GET /api/courses/:id
 */
const getCourseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const course = await Course.findById(id)
    .populate('facultyId', 'name email department')
    .populate('enrolledStudents', 'name email rollNumber year section');
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  // Check access - compare as strings to handle ObjectId vs String
  if (req.user.role === 'faculty') {
    const courseFacultyId = course.facultyId._id ? course.facultyId._id.toString() : course.facultyId.toString();
    if (courseFacultyId !== req.userId.toString()) {
      throw ApiError.forbidden('You can only view your own courses');
    }
  }
  
  // Get COs for this course
  const cos = await CourseOutcome.findByCourse(id);
  
  // Check if matrix exists
  const matrix = await POMatrix.findByCourse(id);
  
  // Get marks count
  const marksCount = await Marks.countDocuments({ courseId: id });
  
  // Get attainment status
  const attainment = await Attainment.findByCourse(id);
  
  return ApiResponse.success(res, 200, 'Course retrieved successfully', {
    course,
    coCount: cos.length,
    hasMatrix: !!matrix,
    marksRecordsCount: marksCount,
    hasAttainment: !!attainment,
    attainmentGeneratedAt: attainment?.generatedAt || null
  });
});

/**
 * Update course
 * PATCH /api/courses/:id
 */
const updateCourse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { courseCode, courseName, semester, academicYear, facultyId, credits, description, isActive } = req.body;
  
  const course = await Course.findById(id);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  // Check ownership
  if (req.user.role === 'faculty') {
    const courseFacultyId = course.facultyId.toString();
    if (courseFacultyId !== req.userId.toString()) {
      throw ApiError.forbidden('You can only update your own courses');
    }
  }
  
  // Determine the new values for duplicate check
  const newCourseCode = courseCode ? courseCode.toUpperCase() : course.courseCode;
  const newSemester = semester || course.semester;
  const newAcademicYear = academicYear || course.academicYear;
  const newDepartment = course.department;

  // Check for duplicate course code if any relevant fields changed
  if (
    newCourseCode !== course.courseCode ||
    newSemester !== course.semester ||
    newAcademicYear !== course.academicYear
  ) {
    const existing = await Course.findOne({
      courseCode: newCourseCode,
      department: newDepartment,
      semester: newSemester,
      academicYear: newAcademicYear,
      facultyId: course.facultyId, // same faculty — avoid self-conflict
      _id: { $ne: id }
    });
    
    if (existing) {
      throw ApiError.conflict('Course with this code already exists for the given semester and academic year');
    }
  }
  
  // Verify new faculty if changing
  if (facultyId && facultyId !== course.facultyId.toString()) {
    const faculty = await User.findOne({ _id: facultyId, role: 'faculty', isActive: true });
    if (!faculty) {
      throw ApiError.notFound('Faculty not found or inactive');
    }
    course.facultyId = facultyId;
  }
  
  // Update fields
  if (courseCode) course.courseCode = courseCode.toUpperCase();
  if (courseName) course.courseName = courseName;
  if (semester) course.semester = semester;
  if (academicYear) course.academicYear = academicYear;
  if (credits !== undefined) course.credits = credits;
  if (description !== undefined) course.description = description;
  if (isActive !== undefined) course.isActive = isActive;
  
  await course.save();
  
  await course.populate('facultyId', 'name email department');
  
  return ApiResponse.success(res, 200, 'Course updated successfully', { course });
});

/**
 * Soft delete course (admin only)
 * DELETE /api/courses/:id
 */
const deleteCourse = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { force } = req.query;
  
  const course = await Course.findById(id);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  // Check if attainment exists
  const attainment = await Attainment.findByCourse(id);
  if (attainment && force !== 'true') {
    throw ApiError.badRequest(
      'Cannot delete course with attainment data. Clear attainment first or use force=true.'
    );
  }
  
  // Delete related data
  if (force === 'true') {
    await Attainment.deleteOne({ courseId: id });
  }
  
  // Soft delete
  course.isActive = false;
  await course.save();
  
  return ApiResponse.success(res, 200, 'Course deactivated successfully');
});

/**
 * Enroll students in course
 * POST /api/courses/:id/enroll
 */
const enrollStudents = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { studentIds } = req.body;
  
  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    throw ApiError.badRequest('Student IDs array is required');
  }
  
  const course = await Course.findById(id);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  // Check ownership
  if (req.user.role === 'faculty') {
    const courseFacultyId = course.facultyId.toString();
    if (courseFacultyId !== req.userId.toString()) {
      throw ApiError.forbidden('You can only enroll students in your own courses');
    }
  }
  
  // Validate students
  const students = await User.find({
    _id: { $in: studentIds },
    role: 'student',
    isActive: true
  }).select('_id');
  
  const validStudentIds = students.map(s => s._id.toString());
  const invalidIds = studentIds.filter(id => !validStudentIds.includes(id));
  
  // Filter out already enrolled students
  const alreadyEnrolled = [];
  const newStudentIds = [];
  
  for (const studentId of validStudentIds) {
    if (course.enrolledStudents.some(s => s.toString() === studentId)) {
      alreadyEnrolled.push(studentId);
    } else {
      newStudentIds.push(studentId);
    }
  }
  
  // Add new students
  if (newStudentIds.length > 0) {
    course.enrolledStudents.push(...newStudentIds);
    await course.save();
  }
  
  return ApiResponse.success(res, 200, 'Students enrolled successfully', {
    enrolledCount: newStudentIds.length,
    alreadyEnrolledCount: alreadyEnrolled.length,
    invalidCount: invalidIds.length,
    alreadyEnrolled,
    invalidIds
  });
});

/**
 * Remove student from course
 * DELETE /api/courses/:id/enroll/:studentId
 */
const removeStudent = asyncHandler(async (req, res, next) => {
  const { id, studentId } = req.params;
  
  const course = await Course.findById(id);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  // Check ownership
  if (req.user.role === 'faculty') {
    const courseFacultyId = course.facultyId.toString();
    if (courseFacultyId !== req.userId.toString()) {
      throw ApiError.forbidden('You can only remove students from your own courses');
    }
  }
  
  // Check if student is enrolled
  const studentIndex = course.enrolledStudents.findIndex(
    s => s.toString() === studentId
  );
  
  if (studentIndex === -1) {
    throw ApiError.notFound('Student is not enrolled in this course');
  }
  
  // Remove student
  course.enrolledStudents.splice(studentIndex, 1);
  await course.save();
  
  return ApiResponse.success(res, 200, 'Student removed from course');
});

/**
 * Get courses for a student (their enrolled courses)
 * GET /api/courses/student/my-courses
 */
const getStudentCourses = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'student') {
    throw ApiError.forbidden('This endpoint is for students only');
  }
  
  const courses = await Course.find({
    enrolledStudents: req.userId,
    isActive: true
  })
    .populate('facultyId', 'name email')
    .select('-enrolledStudents')
    .sort({ semester: 1, courseCode: 1 })
    .lean();
  
  return ApiResponse.success(res, 200, 'Enrolled courses retrieved', {
    courses,
    count: courses.length
  });
});

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollStudents,
  removeStudent,
  getStudentCourses
};