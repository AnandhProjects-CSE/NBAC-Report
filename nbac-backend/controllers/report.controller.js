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
const InfrastructureFeedback = require('../models/InfrastructureFeedback.model');
const User = require('../models/User.model');
const attainmentService = require('../services/attainment.service');
const gradingSchema = require('../config/gradingSchema');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Derive NAAC grade from overall attainment percentage using configurable schema
 * @param {number} percentage - 0-100
 * @returns {string} Grade string e.g. "A++"
 */
const getNAACGrade = (percentage) => {
  if (typeof percentage !== 'number' || isNaN(percentage)) return 'N/A';
  for (const entry of gradingSchema) {
    if (percentage >= entry.minPercentage) return entry.grade;
  }
  return 'C';
};

/**
 * Get attainment level description
 */
const getAttainmentLevel = (value) => {
  if (value === null || value === undefined) return 'N/A';
  if (value >= 2.5) return 'High (3)';
  if (value >= 1.5) return 'Medium (2)';
  if (value >= 0.5) return 'Low (1)';
  return 'Very Low (0)';
};

/**
 * Auto-generate recommendations from CO attainment data
 * Targets COs with finalAttainment < 1.5 (below medium level)
 */
const generateRecommendations = (coAttainments) => {
  const recommendations = [];
  const weakCOs = coAttainments
    .filter(co => co.finalAttainment < 1.5)
    .sort((a, b) => a.finalAttainment - b.finalAttainment);

  for (const co of weakCOs) {
    const rec = {
      coNumber: co.coNumber,
      currentAttainment: co.finalAttainment,
      priority: co.finalAttainment < 0.5 ? 'Critical' : 'High',
      suggestions: []
    };

    if (co.directAttainment < 1.5) {
      rec.suggestions.push(`Improve assessment performance in ${co.coNumber} — direct attainment is ${co.directAttainment.toFixed(2)}`);
      rec.suggestions.push(`Review teaching methodology and increase formative assessments for ${co.coNumber}`);
    }
    if (co.indirectAttainment < 1.5) {
      rec.suggestions.push(`Increase student engagement and awareness for ${co.coNumber} — indirect attainment is ${co.indirectAttainment.toFixed(2)}`);
    }
    if (co.successPercentage < 50) {
      rec.suggestions.push(`Only ${co.successPercentage.toFixed(1)}% of students attained ${co.coNumber} — consider remedial sessions or revised content delivery`);
    }
    recommendations.push(rec);
  }

  // General recommendations when overall is weak
  const avgAttainment = coAttainments.length > 0
    ? coAttainments.reduce((s, c) => s + c.finalAttainment, 0) / coAttainments.length
    : 0;

  if (avgAttainment < 2.0) {
    recommendations.push({
      coNumber: 'GENERAL',
      currentAttainment: avgAttainment,
      priority: 'Medium',
      suggestions: [
        'Strengthen feedback loop between faculty and students through regular CO-awareness sessions',
        'Consider revising CO threshold criteria if industry benchmarks have changed',
        'Increase assignment diversity and lab participation to boost indirect assessment scores'
      ]
    });
  }

  return recommendations;
};

/**
 * Get CO attainment report data
 * GET /api/reports/:courseId/co
 */
const getCOReport = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId)
    .populate('facultyId', 'name email department');

  if (!course) throw ApiError.notFound('Course not found');

  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view reports for your own courses');
  }

  const attainment = await Attainment.findByCourse(courseId);
  if (!attainment) throw ApiError.notFound('No attainment data found. Calculate attainment first.');

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

  if (!course) throw ApiError.notFound('Course not found');

  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view reports for your own courses');
  }

  const attainment = await Attainment.findByCourse(courseId);
  if (!attainment) throw ApiError.notFound('No attainment data found. Calculate attainment first.');

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
 * Get full professional NAAC report data (all 9 sections)
 * GET /api/reports/:courseId/full
 */
const getFullReport = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId)
    .populate('facultyId', 'name email department')
    .populate('enrolledStudents', 'name rollNumber');

  if (!course) throw ApiError.notFound('Course not found');

  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view reports for your own courses');
  }

  const attainment = await Attainment.findByCourse(courseId);
  if (!attainment) throw ApiError.notFound('No attainment data found. Calculate attainment first.');

  const [cos, matrix, feedbackSummary, totalFeedbackCount, marksRecords] = await Promise.all([
    CourseOutcome.findByCourse(courseId),
    POMatrix.findByCourse(courseId),
    Feedback.getSummaryByCourse(courseId),
    Feedback.countDocuments({ courseId }),
    Marks.findByCourse(courseId).lean()
  ]);

  // Section 6: Infrastructure Feedback (filtered by course department + semester + academicYear)
  let infraSummary = [];
  try {
    infraSummary = await InfrastructureFeedback.getAggregatedSummary({
      department: course.department,
      semester: course.semester,
      academicYear: course.academicYear
    });
    // Ensure all 3 types present
    const RATING_TYPES = ['LIBRARY', 'TRANSPORT', 'CANTEEN'];
    infraSummary = RATING_TYPES.map(type => {
      const found = infraSummary.find(s => s.ratingType === type);
      return found || { ratingType: type, averageRating: null, totalResponses: 0 };
    });
  } catch (_) {
    infraSummary = [
      { ratingType: 'LIBRARY', averageRating: null, totalResponses: 0 },
      { ratingType: 'TRANSPORT', averageRating: null, totalResponses: 0 },
      { ratingType: 'CANTEEN', averageRating: null, totalResponses: 0 }
    ];
  }

  // Section 8: Final NAAC grade
  const averageCOAttainment = attainment.summary.averageCOAttainment || 0;
  const overallAttainmentPercentage = parseFloat(((averageCOAttainment / 3) * 100).toFixed(2));
  const naacGrade = getNAACGrade(overallAttainmentPercentage);

  // Section 9: Auto-generated recommendations
  const recommendations = generateRecommendations(attainment.coAttainments);

  // CO attainment levels for all COs (needed for section 4)
  const coThresholds = {};
  cos.forEach(co => { coThresholds[co._id.toString()] = co.threshold || 60; });

  // Assessment methodology labels
  const assessmentMethodLabels = {
    internal1: 'Internal Exam 1 (Mid-Term)',
    internal2: 'Internal Exam 2 (Mid-Term)',
    assignment: 'Assignments / Coursework',
    external: 'End Semester Examination'
  };
  const directWeightage = 80;
  const indirectWeightage = 20;

  const report = {
    // SECTION 1: Institution Information
    institutionInfo: {
      collegeName: process.env.COLLEGE_NAME || 'Institution Name',
      programName: process.env.PROGRAM_NAME || 'B.Tech / BE',
      department: course.department,
      academicYear: course.academicYear,
      semester: course.semester,
      courseList: [{ courseCode: course.courseCode, courseName: course.courseName }]
    },

    // SECTION 2: Course Outcome Framework
    courseOutcomeFramework: {
      courseCode: course.courseCode,
      courseName: course.courseName,
      instructor: course.facultyId,
      outcomes: cos.map(co => ({
        coNumber: co.coNumber,
        description: co.description,
        threshold: co.threshold || 60
      })),
      hasPOMapping: !!matrix,
      poMatrix: matrix ? matrix.rows.map(row => ({
        coNumber: row.coNumber,
        PO1: row.po1, PO2: row.po2, PO3: row.po3,
        PO4: row.po4, PO5: row.po5, PO6: row.po6,
        PO7: row.po7, PO8: row.po8, PO9: row.po9,
        PO10: row.po10, PO11: row.po11, PO12: row.po12
      })) : []
    },

    // SECTION 3: Assessment Methodology
    assessmentMethodology: {
      directMethods: marksRecords.map(m => ({
        type: m.assessmentType,
        label: assessmentMethodLabels[m.assessmentType] || m.assessmentType,
        totalRecords: m.records.length,
        totalMaxMarks: m.totalMaxMarks,
        uploadedAt: m.uploadedAt
      })),
      indirectMethods: [{
        type: 'student_feedback',
        label: 'Student CO Feedback Survey (1–5 Rating Scale)',
        totalResponses: totalFeedbackCount
      }],
      weightages: {
        direct: directWeightage,
        indirect: indirectWeightage,
        formulaDescription: `Final CO Attainment = (${directWeightage / 100} × Direct Attainment) + (${indirectWeightage / 100} × Indirect Attainment)`
      },
      hasAllAssessments: ['internal1', 'internal2', 'assignment', 'external'].every(
        type => marksRecords.some(m => m.assessmentType === type)
      )
    },

    // SECTION 4: Attainment Calculation Summary
    attainmentSummary: {
      directAttainmentScale: [
        { range: '≥ 70%', level: 3, label: 'High' },
        { range: '60–69%', level: 2, label: 'Medium' },
        { range: '50–59%', level: 1, label: 'Low' },
        { range: '< 50%', level: 0, label: 'Very Low' }
      ],
      indirectAttainmentScale: [
        { range: '≥ 4.5 stars', level: 3, label: 'High' },
        { range: '3.5–4.4 stars', level: 2, label: 'Medium' },
        { range: '2.5–3.4 stars', level: 1, label: 'Low' },
        { range: '< 2.5 stars', level: 0, label: 'Very Low' }
      ],
      coAttainments: attainment.coAttainments.map(co => ({
        coNumber: co.coNumber,
        description: co.description,
        threshold: coThresholds[co.coId.toString()] || 60,
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

    // SECTION 5: Student Feedback Analysis
    feedbackAnalysis: {
      totalResponses: totalFeedbackCount,
      totalEnrolled: course.enrolledStudents.length,
      responseRate: course.enrolledStudents.length > 0
        ? parseFloat(((totalFeedbackCount / course.enrolledStudents.length) * 100).toFixed(1))
        : 0,
      coWiseRatings: feedbackSummary.map(f => ({
        coNumber: f.coNumber,
        averageRating: f.averageRating,
        totalResponses: f.totalResponses,
        interpretation: f.averageRating >= 4.5 ? 'Excellent' : f.averageRating >= 3.5 ? 'Good' : f.averageRating >= 2.5 ? 'Average' : 'Below Average'
      })),
      overallAverageRating: feedbackSummary.length > 0
        ? parseFloat((feedbackSummary.reduce((sum, f) => sum + f.averageRating, 0) / feedbackSummary.length).toFixed(2))
        : null
    },

    // SECTION 6: Infrastructure Feedback
    infrastructureFeedback: {
      facilities: infraSummary,
      semester: course.semester,
      academicYear: course.academicYear,
      department: course.department
    },

    // SECTION 7: Faculty Performance Summary
    facultyPerformance: {
      faculty: {
        name: course.facultyId?.name || 'N/A',
        email: course.facultyId?.email || 'N/A',
        department: course.facultyId?.department || course.department
      },
      courseCode: course.courseCode,
      courseName: course.courseName,
      averageCOAttainment: attainment.summary.averageCOAttainment,
      averagePOAttainment: attainment.summary.averagePOAttainment,
      totalStudents: attainment.summary.totalStudents
    },

    // SECTION 8: Final Attainment Result + NAAC Grade
    finalResult: {
      averageCOAttainment: averageCOAttainment,
      averagePOAttainment: attainment.summary.averagePOAttainment,
      overallAttainmentPercentage,
      naacGrade,
      gradingSchema: gradingSchema,
      interpretation: naacGrade === 'A++' || naacGrade === 'A+' || naacGrade === 'A'
        ? 'Excellent — Course outcomes are well attained'
        : naacGrade === 'B++' || naacGrade === 'B+' || naacGrade === 'B'
          ? 'Satisfactory — Room for improvement in some outcomes'
          : 'Needs Improvement — Significant gaps in outcome attainment'
    },

    // SECTION 9: Recommendations
    recommendations,

    // Meta
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

    // PO Attainment (used by report page sections)
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

    // Backward-compatible legacy fields
    coAttainment: {
      table: attainment.coAttainments.map(co => ({
        coNumber: co.coNumber,
        description: co.description,
        threshold: coThresholds[co.coId.toString()] || 60,
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

  return ApiResponse.success(res, 200, 'Full NAAC report generated', { report });
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
          poAggregates[po.poNumber] = { values: [], courses: [] };
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
 * Export report as JSON
 * GET /api/reports/:courseId/export
 */
const exportReport = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId)
    .populate('facultyId', 'name email department')
    .populate('enrolledStudents', 'name rollNumber');

  if (!course) throw ApiError.notFound('Course not found');

  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only export reports for your own courses');
  }

  const attainment = await Attainment.findByCourse(courseId);
  if (!attainment) throw ApiError.notFound('No attainment data found');

  const exportData = {
    title: `NAAC Accreditation Report - ${course.courseCode}`,
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
    `attachment; filename="naac_report_${course.courseCode}_${Date.now()}.json"`
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