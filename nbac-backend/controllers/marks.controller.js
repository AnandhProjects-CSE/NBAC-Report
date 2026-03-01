/**
 * Marks Controller
 * Handles marks upload and management with Excel parsing
 */

const Course = require('../models/Course.model');
const CourseOutcome = require('../models/CourseOutcome.model');
const Marks = require('../models/Marks.model');
const User = require('../models/User.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const xlsx = require('xlsx');
const { cleanupFile } = require('../middleware/upload.middleware');

/**
 * Upload marks via Excel file
 * POST /api/courses/:courseId/marks/upload
 * 
 * Expected Excel format (two header rows):
 * Row 1: | StudentID | Q1_CO1 | Q2_CO1 | Q3_CO2 | Q4_CO3 | ... |
 * Row 2: |           | 10     | 10     | 10     | 10     | ... | (max marks)
 * Row 3+: | 22R11A05W0| 8      | 9      | 10     | 7      | ... |
 */
const uploadMarks = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const { assessmentType } = req.body;
  
  // Validate assessment type
  if (!assessmentType || !['internal1', 'internal2', 'assignment', 'external'].includes(assessmentType)) {
    throw ApiError.badRequest('Valid assessment type is required (internal1, internal2, assignment, external)');
  }
  
  // Check file uploaded
  if (!req.file) {
    throw ApiError.badRequest('Excel file is required');
  }
  
  const filePath = req.file.path;
  
  try {
    // Check course exists and ownership
    const course = await Course.findById(courseId)
      .populate('enrolledStudents', 'rollNumber name');
    
    if (!course) {
      throw ApiError.notFound('Course not found');
    }
    
    if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
      throw ApiError.forbidden('You can only upload marks for your own courses');
    }
    
    // Check if assessment type already uploaded
    const existingMarks = await Marks.assessmentExists(courseId, assessmentType);
    if (existingMarks) {
      throw ApiError.conflict(
        `${assessmentType} marks already uploaded for this course. Delete existing record first.`
      );
    }
    
    // Get COs for this course
    const cos = await CourseOutcome.findByCourse(courseId);
    if (cos.length === 0) {
      throw ApiError.badRequest('No Course Outcomes defined for this course. Please add COs first.');
    }
    
    // Create CO mapping
    const coMap = new Map();
    cos.forEach(co => {
      coMap.set(co.coNumber.toUpperCase(), co._id);
    });
    
    // Read Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
      throw ApiError.badRequest('Excel file has no sheets');
    }
    
    const sheet = workbook.Sheets[sheetName];
    
    // Get sheet as array of arrays for two-header-row parsing
    const sheetData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    if (sheetData.length < 3) {
      throw ApiError.badRequest('Excel sheet must have at least 3 rows (2 headers + 1 data row)');
    }
    
    // Parse header row 1 (question-CO labels)
    const headerRow1 = sheetData[0];
    // Parse header row 2 (max marks)
    const headerRow2 = sheetData[1];
    
    // Validate first column is student ID
    const studentIdCol = (headerRow1[0] || '').toString().toLowerCase();
    if (!studentIdCol.includes('student') && !studentIdCol.includes('roll') && !studentIdCol.includes('id')) {
      throw ApiError.badRequest('First column must be Student ID / Roll Number');
    }
    
    // Parse question columns
    const questionConfigs = [];
    const errors = [];
    
    for (let i = 1; i < headerRow1.length; i++) {
      const colLabel = (headerRow1[i] || '').toString().trim();
      const maxMarks = parseFloat(headerRow2[i]);
      
      if (!colLabel) continue;
      
      // Parse question number and CO mapping from label (e.g., "Q1_CO1", "Q2-CO2", "Q3 CO3")
      const match = colLabel.match(/Q(\d+)[\s_-]*(CO[1-9]\d*)/i);
      
      if (!match) {
        errors.push({ column: i + 1, label: colLabel, message: 'Invalid format. Expected Q#_CO# (e.g., Q1_CO1)' });
        continue;
      }
      
      const questionNo = `Q${match[1]}`;
      const coNumber = match[2].toUpperCase();
      
      // Validate CO exists
      const coId = coMap.get(coNumber);
      if (!coId) {
        errors.push({ column: i + 1, label: colLabel, message: `CO "${coNumber}" not found in course` });
        continue;
      }
      
      // Validate max marks
      if (isNaN(maxMarks) || maxMarks <= 0) {
        errors.push({ column: i + 1, label: colLabel, message: 'Invalid or missing max marks in row 2' });
        continue;
      }
      
      questionConfigs.push({
        columnIndex: i,
        questionNo,
        coNumber,
        coId,
        maxMarks
      });
    }
    
    if (questionConfigs.length === 0) {
      throw ApiError.badRequest('No valid question columns found', errors);
    }
    
    // Create student roll number to ID mapping
    const studentMap = new Map();
    course.enrolledStudents.forEach(student => {
      if (student.rollNumber) {
        studentMap.set(student.rollNumber.toUpperCase(), student._id);
      }
    });
    
    // Parse student records (row 3 onwards)
    const records = [];
    const warnings = [];
    const skippedStudents = [];
    
    for (let rowIndex = 2; rowIndex < sheetData.length; rowIndex++) {
      const row = sheetData[rowIndex];
      
      if (!row || row.length === 0) continue;
      
      const rollNumber = (row[0] || '').toString().trim().toUpperCase();
      
      if (!rollNumber) continue;
      
      // Find student
      const studentId = studentMap.get(rollNumber);
      if (!studentId) {
        skippedStudents.push({ row: rowIndex + 1, rollNumber, reason: 'Not enrolled in course' });
        continue;
      }
      
      // Parse question marks
      const questionWiseMarks = [];
      
      for (const config of questionConfigs) {
        const marksObtained = parseFloat(row[config.columnIndex]) || 0;
        
        // Validate marks don't exceed max
        if (marksObtained > config.maxMarks) {
          warnings.push({
            row: rowIndex + 1,
            rollNumber,
            question: config.questionNo,
            message: `Marks ${marksObtained} exceeds max ${config.maxMarks}, capped to max`
          });
        }
        
        questionWiseMarks.push({
          questionNo: config.questionNo,
          marksObtained: Math.min(marksObtained, config.maxMarks),
          maxMarks: config.maxMarks,
          mappedCO: config.coId
        });
      }
      
      records.push({
        studentId,
        rollNumber,
        questionWiseMarks
      });
    }
    
    if (records.length === 0) {
      throw ApiError.badRequest('No valid student records found', [
        ...errors,
        ...skippedStudents.map(s => ({ ...s, message: s.reason }))
      ]);
    }
    
    // Create marks record
    const marks = await Marks.create({
      courseId,
      uploadedBy: req.userId,
      assessmentType,
      records,
      originalFileName: req.file.originalname,
      isProcessed: false
    });
    
    // Calculate total max marks
    marks.totalMaxMarks = marks.calculateTotalMaxMarks();
    await marks.save();
    
    // Get CO coverage
    const mappedCOs = marks.getMappedCOs();
    const unmappedCOs = cos.filter(co => !mappedCOs.includes(co._id.toString()));
    
    return ApiResponse.created(res, 'Marks uploaded successfully', {
      marks: {
        _id: marks._id,
        assessmentType: marks.assessmentType,
        totalRecords: records.length,
        totalQuestions: questionConfigs.length,
        totalMaxMarks: marks.totalMaxMarks,
        uploadedAt: marks.uploadedAt
      },
      summary: {
        totalStudents: records.length,
        skippedStudents: skippedStudents.length,
        cosCovered: mappedCOs.length,
        cosNotCovered: unmappedCOs.length
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      errors: errors.length > 0 ? errors : undefined,
      skippedStudents: skippedStudents.length > 0 ? skippedStudents : undefined
    });
    
  } finally {
    // Clean up uploaded file
    cleanupFile(filePath);
  }
});

/**
 * Get all marks records for a course
 * GET /api/courses/:courseId/marks
 */
const getAllMarks = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view marks for your own courses');
  }
  
  // Get marks records
  const marks = await Marks.findByCourse(courseId)
    .populate('uploadedBy', 'name email')
    .lean();
  
  // Summarize each record (don't return all student data)
  const summarizedMarks = marks.map(m => ({
    _id: m._id,
    assessmentType: m.assessmentType,
    uploadedBy: m.uploadedBy,
    uploadedAt: m.uploadedAt,
    isProcessed: m.isProcessed,
    totalMaxMarks: m.totalMaxMarks,
    totalRecords: m.records.length,
    originalFileName: m.originalFileName
  }));
  
  return ApiResponse.success(res, 200, 'Marks records retrieved', {
    course: {
      _id: course._id,
      courseCode: course.courseCode,
      courseName: course.courseName
    },
    marks: summarizedMarks,
    count: marks.length
  });
});

/**
 * Get a specific marks record
 * GET /api/courses/:courseId/marks/:marksId
 */
const getMarksById = asyncHandler(async (req, res, next) => {
  const { courseId, marksId } = req.params;
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view marks for your own courses');
  }
  
  // Get marks record
  const marks = await Marks.findOne({ _id: marksId, courseId })
    .populate('uploadedBy', 'name email')
    .populate('records.studentId', 'name rollNumber')
    .populate('records.questionWiseMarks.mappedCO', 'coNumber description');
  
  if (!marks) {
    throw ApiError.notFound('Marks record not found');
  }
  
  return ApiResponse.success(res, 200, 'Marks record retrieved', { marks });
});

/**
 * Delete a marks record
 * DELETE /api/courses/:courseId/marks/:marksId
 */
const deleteMarks = asyncHandler(async (req, res, next) => {
  const { courseId, marksId } = req.params;
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only delete marks for your own courses');
  }
  
  // Find and delete marks
  const marks = await Marks.findOneAndDelete({ _id: marksId, courseId });
  
  if (!marks) {
    throw ApiError.notFound('Marks record not found');
  }
  
  // Note: In a real system, you might want to recalculate attainment here
  // or mark attainment as stale
  
  return ApiResponse.success(res, 200, 'Marks record deleted successfully');
});

/**
 * Get marks template for download
 * GET /api/courses/:courseId/marks/template
 */
const getMarksTemplate = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  // Check course exists
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  // Get COs
  const cos = await CourseOutcome.findByCourse(courseId);
  
  if (cos.length === 0) {
    throw ApiError.badRequest('No Course Outcomes defined. Please add COs first.');
  }
  
  // Create template
  // Row 1: Headers with CO mapping
  const headerRow1 = ['StudentID/RollNumber'];
  // Row 2: Max marks
  const headerRow2 = [''];
  
  // Add sample question columns (3 per CO as example)
  let qNum = 1;
  cos.forEach(co => {
    for (let i = 0; i < 2; i++) { // 2 questions per CO as sample
      headerRow1.push(`Q${qNum}_${co.coNumber}`);
      headerRow2.push(10); // Default max marks
      qNum++;
    }
  });
  
  // Create workbook
  const templateData = [headerRow1, headerRow2];
  
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet(templateData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 20 },  // Student ID
    ...Array(headerRow1.length - 1).fill({ wch: 12 })  // Questions
  ];
  
  xlsx.utils.book_append_sheet(wb, ws, 'Marks Upload Template');
  
  // Write to buffer
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  // Send file
  res.setHeader('Content-Disposition', `attachment; filename="marks_template_${course.courseCode}.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

/**
 * Get student-wise marks summary
 * GET /api/courses/:courseId/marks/summary
 */
const getMarksSummary = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view marks for your own courses');
  }
  
  // Get all marks records
  const marksRecords = await Marks.findByCourse(courseId)
    .populate('records.studentId', 'name rollNumber')
    .lean();
  
  if (marksRecords.length === 0) {
    return ApiResponse.success(res, 200, 'No marks records found', {
      summary: null
    });
  }
  
  // Aggregate by student
  const studentSummary = {};
  
  for (const record of marksRecords) {
    for (const studentRecord of record.records) {
      const studentId = studentRecord.studentId?._id?.toString() || studentRecord.studentId?.toString();
      
      if (!studentId) continue;
      
      if (!studentSummary[studentId]) {
        studentSummary[studentId] = {
          student: studentRecord.studentId,
          assessments: {}
        };
      }
      
      // Calculate total for this assessment
      const totalObtained = studentRecord.questionWiseMarks.reduce(
        (sum, q) => sum + q.marksObtained, 0
      );
      const totalMax = studentRecord.questionWiseMarks.reduce(
        (sum, q) => sum + q.maxMarks, 0
      );
      
      studentSummary[studentId].assessments[record.assessmentType] = {
        obtained: totalObtained,
        max: totalMax,
        percentage: totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : 0
      };
    }
  }
  
  return ApiResponse.success(res, 200, 'Marks summary retrieved', {
    studentSummary: Object.values(studentSummary),
    assessmentTypes: marksRecords.map(r => r.assessmentType)
  });
});

module.exports = {
  uploadMarks,
  getAllMarks,
  getMarksById,
  deleteMarks,
  getMarksTemplate,
  getMarksSummary
};
