/**
 * Report Controller
 * Generates NBA-compliant reports for courses and departments
 */

const Course = require('../models/Course.model');
const CourseOutcome = require('../models/CourseOutcome.model');
const POMatrix = require('../models/POMatrix.model');
const Marks = require('../models/Marks.model');
const Feedback = require('../models/Feedback.model');
const Attainment = require('../models/Attainment.model');
const User = require('../models/User.model');
const attainmentService = require('../services/attainment.service');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get CO attainment report data
 * GET /api/reports/:courseId/co
 */
const getCOReport = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  const course = await Course.findById(courseId)
    .populate('facultyId', 'name email department');
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view reports for your own courses');
  }
  
  const attainment = await Attainment.findByCourse(courseId);
  
  if (!attainment) {
    throw ApiError.notFound('No attainment data found. Calculate attainment first.');
  }
  
  const cos = await CourseOutcome.findByCourse(courseId);
  
  const report = {
    courseInfo: {
      courseCode: course.courseCode,
      courseName: course.courseName,
      department: course.department,
      semester: course.semester,
      academicYear: course.academicYear,
      faculty: course.facultyId,
      credits: course.credits
    },
    coAttainmentTable: attainment.coAttainments.map(co => ({
      coNumber: co.coNumber,
      description: co.description,
      threshold: cos.find(c => c._id.toString() === co.coId.toString())?.threshold || 60,
      studentsAttained: co.studentsAttained,
      totalStudents: co.totalStudents,
      successPercentage: co.successPercentage,
      directAttainment: co.directAttainment,
      indirectAttainment: co.indirectAttainment,
      finalAttainment: co.finalAttainment,
      attainmentLevel: getAttainmentLevel(co.finalAttainment)
    })),
    summary: {
      totalCOs: attainment.summary.totalCOs,
      averageCOAttainment: attainment.summary.averageCOAttainment,
      generatedAt: attainment.generatedAt
    }
  };
  
  return ApiResponse.success(res, 200, 'CO attainment report generated', { report });
});

/**
 * Get PO attainment report data
 * GET /api/reports/:courseId/po
 */
const getPOReport = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  const course = await Course.findById(courseId)
    .populate('facultyId', 'name email department');
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view reports for your own courses');
  }
  
  const attainment = await Attainment.findByCourse(courseId);
  
  if (!attainment) {
    throw ApiError.notFound('No attainment data found. Calculate attainment first.');
  }
  
  const matrix = await POMatrix.findByCourse(courseId);
  
  const report = {
    courseInfo: {
      courseCode: course.courseCode,
      courseName: course.courseName,
      department: course.department,
      semester: course.semester,
      academicYear: course.academicYear,
      faculty: course.facultyId
    },
    poAttainmentTable: attainment.poAttainments.map(po => ({
      poNumber: po.poNumber,
      poName: po.poName,
      attainmentValue: po.attainmentValue,
      attainmentLevel: getAttainmentLevel(po.attainmentValue),
      contributingCOs: po.contributingCOs,
      correlationWeight: po.totalCorrelationWeight
    })),
    coPOMatrix: matrix ? {
      rows: matrix.rows.map(row => ({
        coNumber: row.coNumber,
        correlations: {
          PO1: row.po1, PO2: row.po2, PO3: row.po3,
          PO4: row.po4, PO5: row.po5, PO6: row.po6,
          PO7: row.po7, PO8: row.po8, PO9: row.po9,
          PO10: row.po10, PO11: row.po11, PO12: row.po12
        }
      }))
    } : null,
    summary: {
      averagePOAttainment: attainment.summary.averagePOAttainment,
      totalCOsContributing: attainment.poAttainments.reduce(
        (sum, po) => sum + po.contributingCOs, 0
      )
    }
  };
  
  return ApiResponse.success(res, 200, 'PO attainment report generated', { report });
});

/**
 * Get full NBA report data (CO + PO + feedback summary)
 * GET /api/reports/:courseId/full
 */
const getFullReport = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  const course = await Course.findById(courseId)
    .populate('facultyId', 'name email department')
    .populate('enrolledStudents', 'name rollNumber');
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view reports for your own courses');
  }
  
  const attainment = await Attainment.findByCourse(courseId);
  
  if (!attainment) {
    throw ApiError.notFound('No attainment data found. Calculate attainment first.');
  }
  
  const cos = await CourseOutcome.findByCourse(courseId);
  const matrix = await POMatrix.findByCourse(courseId);
  const feedbackSummary = await Feedback.getSummaryByCourse(courseId);
  const totalFeedbackCount = await Feedback.countDocuments({ courseId });
  const marksRecords = await Marks.findByCourse(courseId).lean();
  
  const report = {
    courseInfo: {
      courseCode: course.courseCode,
      courseName: course.courseName,
      department: course.department,
      semester: course.semester,
      academicYear: course.academicYear,
      faculty: course.facultyId,
      credits: course.credits,
      totalEnrolledStudents: course.enrolledStudents.length
    },
    coAttainment: {
      table: attainment.coAttainments.map(co => ({
        coNumber: co.coNumber,
        description: co.description,
        threshold: cos.find(c => c._id.toString() === co.coId.toString())?.threshold || 60,
        studentsAttained: co.studentsAttained,
        totalStudents: co.totalStudents,
        successPercentage: co.successPercentage,
        directAttainment: co.directAttainment,
        indirectAttainment: co.indirectAttainment,
        finalAttainment: co.finalAttainment,
        attainmentLevel: getAttainmentLevel(co.finalAttainment),
        averageFeedbackRating: co.averageFeedbackRating
      })),
      summary: {
        totalCOs: attainment.summary.totalCOs,
        averageCOAttainment: attainment.summary.averageCOAttainment
      }
    },
    coPOMatrix: matrix ? matrix.rows.map(row => ({
      coNumber: row.coNumber,
      PO1: row.po1, PO2: row.po2, PO3: row.po3,
      PO4: row.po4, PO5: row.po5, PO6: row.po6,
      PO7: row.po7, PO8: row.po8, PO9: row.po9,
      PO10: row.po10, PO11: row.po11, PO12: row.po12
    })) : [],
    poAttainment: {
      table: attainment.poAttainments.map(po => ({
        poNumber: po.poNumber,
        poName: po.poName,
        attainmentValue: po.attainmentValue,
        attainmentLevel: getAttainmentLevel(po.attainmentValue),
        contributingCOs: po.contributingCOs
      })),
      summary: {
        averagePOAttainment: attainment.summary.averagePOAttainment
      }
    },
    feedbackSummary: {
      totalResponses: totalFeedbackCount,
      responseRate: course.enrolledStudents.length > 0
        ? ((totalFeedbackCount / course.enrolledStudents.length) * 100).toFixed(1)
        : 0,
      coWiseRatings: feedbackSummary.map(f => ({
        coNumber: f.coNumber,
        averageRating: f.averageRating,
        totalResponses: f.totalResponses
      })),
      overallAverageRating: feedbackSummary.length > 0
        ? (feedbackSummary.reduce((sum, f) => sum + f.averageRating, 0) / feedbackSummary.length).toFixed(2)
        : null
    },
    assessments: {
      types: marksRecords.map(m => ({
        type: m.assessmentType,
        uploadedAt: m.uploadedAt,
        totalRecords: m.records.length,
        totalMaxMarks: m.totalMaxMarks
      })),
      hasAllAssessments: ['internal1', 'internal2', 'assignment', 'external'].every(
        type => marksRecords.some(m => m.assessmentType === type)
      )
    },
    generatedAt: attainment.generatedAt,
    generatedBy: attainment.generatedBy,
    warnings: attainment.warnings
  };
  
  return ApiResponse.success(res, 200, 'Full NBA report generated', { report });
});

/**
 * Get department-level NBA summary report
 * GET /api/reports/department
 */
const getDepartmentReport = asyncHandler(async (req, res, next) => {
  const { department, academicYear } = req.query;
  
  const userDepartment = department || req.user.department;
  
  if (!userDepartment) {
    throw ApiError.badRequest('Department is required');
  }
  
  const summary = await attainmentService.getDepartmentSummary(userDepartment, academicYear);
  
  const poAggregates = {};
  
  if (summary.attainments && summary.attainments.length > 0) {
    for (const att of summary.attainments) {
      const attainment = await Attainment.findById(att._id);
      if (!attainment) continue;
      
      for (const po of attainment.poAttainments) {
        if (po.attainmentValue === null || po.attainmentValue === undefined) continue;
        
        if (!poAggregates[po.poNumber]) {
          poAggregates[po.poNumber] = {
            values: [],
            courses: []
          };
        }
        
        poAggregates[po.poNumber].values.push(po.attainmentValue);
        poAggregates[po.poNumber].courses.push({
          courseCode: att.courseCode,
          value: po.attainmentValue
        });
      }
    }
  }
  
  const poSummary = Object.entries(poAggregates).map(([poNumber, data]) => ({
    poNumber,
    poName: attainmentService.PO_NAMES[poNumber],
    averageAttainment: parseFloat(
      (data.values.reduce((a, b) => a + b, 0) / data.values.length).toFixed(2)
    ),
    courseCount: data.courses.length,
    courses: data.courses
  }));
  
  const totalCourses = summary.courses ? summary.courses.length : 0;
  const coursesWithAttainment = summary.attainments ? summary.attainments.length : 0;
  const averageDeptPO = poSummary.length > 0
    ? parseFloat((poSummary.reduce((sum, po) => sum + po.averageAttainment, 0) / poSummary.length).toFixed(2))
    : 0;
  
  const report = {
    department: userDepartment,
    academicYear: academicYear || 'All years',
    generatedAt: new Date(),
    courses: summary.courses || [],
    courseAttainments: summary.attainments || [],
    poSummary,
    overallSummary: {
      totalCourses,
      coursesWithAttainment,
      averageDepartmentPOAttainment: averageDeptPO
    }
  };
  
  return ApiResponse.success(res, 200, 'Department report generated', { report });
});

/**
 * Get attainment level description
 */
const getAttainmentLevel = (value) => {
  if (value === null) return 'N/A';
  if (value >= 2.5) return 'High (3)';
  if (value >= 1.5) return 'Medium (2)';
  if (value >= 0.5) return 'Low (1)';
  return 'Very Low (0)';
};

/**
 * Export report as JSON
 * GET /api/reports/:courseId/export
 */
const exportReport = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  const course = await Course.findById(courseId)
    .populate('facultyId', 'name email department')
    .populate('enrolledStudents', 'name rollNumber');
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only export reports for your own courses');
  }
  
  const attainment = await Attainment.findByCourse(courseId);
  
  if (!attainment) {
    throw ApiError.notFound('No attainment data found');
  }
  
  const exportData = {
    title: `NBA Accreditation Report - ${course.courseCode}`,
    generatedAt: new Date(),
    course: {
      code: course.courseCode,
      name: course.courseName,
      department: course.department,
      semester: course.semester,
      academicYear: course.academicYear
    },
    coAttainment: attainment.coAttainments,
    poAttainment: attainment.poAttainments,
    summary: attainment.summary
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="nba_report_${course.courseCode}_${Date.now()}.json"`
  );
  
  return res.json(exportData);
});

module.exports = {
  getCOReport,
  getPOReport,
  getFullReport,
  getDepartmentReport,
  exportReport
};