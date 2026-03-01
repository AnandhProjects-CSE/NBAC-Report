/**
 * CO-PO Matrix Controller
 * Handles CO-PO correlation matrix for courses
 */

const Course = require('../models/Course.model');
const CourseOutcome = require('../models/CourseOutcome.model');
const POMatrix = require('../models/POMatrix.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const xlsx = require('xlsx');
const { cleanupFile } = require('../middleware/upload.middleware');

// PO names for reference
const PO_NAMES = {
  'PO1': 'Engineering Knowledge',
  'PO2': 'Problem Analysis',
  'PO3': 'Design/Development of Solutions',
  'PO4': 'Conduct Investigations',
  'PO5': 'Modern Tool Usage',
  'PO6': 'The Engineer and Society',
  'PO7': 'Environment and Sustainability',
  'PO8': 'Ethics',
  'PO9': 'Individual and Team Work',
  'PO10': 'Communication',
  'PO11': 'Project Management and Finance',
  'PO12': 'Life-long Learning'
};

/**
 * Create or replace CO-PO matrix
 * POST /api/courses/:courseId/matrix
 */
const createMatrix = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const { rows } = req.body;
  
  // Validate input
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    throw ApiError.badRequest('Matrix rows are required');
  }
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only manage matrix for your own courses');
  }
  
  // Get all COs for this course
  const cos = await CourseOutcome.findByCourse(courseId);
  const coMap = new Map(cos.map(co => [co.coNumber.toUpperCase(), co._id]));
  
  // Validate and format matrix rows
  const formattedRows = [];
  const errors = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // Validate CO exists - check both coId and coNumber
    let actualCOId = row.coId;
    const coNum = (row.coNumber || '').toUpperCase();
    
    if (!actualCOId && coNum) {
      actualCOId = coMap.get(coNum);
    }
    
    if (!actualCOId) {
      errors.push({ index: i, message: `CO not found: ${row.coNumber || row.coId}` });
      continue;
    }
    
    // Get CO number from database if not provided
    const co = cos.find(c => c._id.toString() === actualCOId.toString());
    const actualCONumber = co ? co.coNumber : coNum;
    
    // Extract correlation values - handle both uppercase (PO1) and lowercase (po1) keys
    const poFields = ['po1', 'po2', 'po3', 'po4', 'po5', 'po6', 'po7', 'po8', 'po9', 'po10', 'po11', 'po12'];
    const correlationValues = {};
    let hasInvalidValue = false;
    
    for (const field of poFields) {
      // Check both lowercase (po1) and uppercase (PO1) keys
      const value = row[field] ?? row[field.toUpperCase()] ?? row[field.toLowerCase()];
      
      if (value !== undefined && value !== null) {
        const numValue = Number(value);
        if (!Number.isInteger(numValue) || numValue < 0 || numValue > 3) {
          errors.push({ 
            index: i, 
            message: `Invalid correlation value for ${field}: ${value}. Must be 0, 1, 2, or 3.` 
          });
          hasInvalidValue = true;
          break;
        }
        correlationValues[field] = numValue;
      } else {
        correlationValues[field] = 0;
      }
    }
    
    if (hasInvalidValue) continue;
    
    formattedRows.push({
      coId: actualCOId,
      coNumber: actualCONumber,
      ...correlationValues
    });
  }
  
  if (errors.length > 0 && formattedRows.length === 0) {
    throw ApiError.badRequest('Invalid matrix data', errors);
  }
  
  // Delete existing matrix if any
  await POMatrix.deleteOne({ courseId });
  
  // Create new matrix
  const matrix = await POMatrix.create({
    courseId,
    rows: formattedRows,
    updatedBy: req.userId
  });
  
  await matrix.populate('rows.coId', 'coNumber description');
  
  return ApiResponse.success(res, 200, 'CO-PO matrix saved successfully', {
    matrix,
    warnings: errors.length > 0 ? errors : undefined
  });
});

/**
 * Get CO-PO matrix for a course
 * GET /api/courses/:courseId/matrix
 */
const getMatrix = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  // Check course exists and ownership
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
    throw ApiError.forbidden('You can only view matrix for your own courses');
  }
  
  // Get matrix
  const matrix = await POMatrix.findByCourse(courseId);
  
  if (!matrix) {
    return ApiResponse.success(res, 200, 'No matrix found for this course', {
      matrix: null,
      poNames: PO_NAMES
    });
  }
  
  return ApiResponse.success(res, 200, 'CO-PO matrix retrieved successfully', {
    matrix,
    poNames: PO_NAMES
  });
});

/**
 * Upload matrix via Excel file
 * POST /api/courses/:courseId/matrix/upload
 * Expected format:
 * | CO   | PO1 | PO2 | PO3 | ... | PO12 |
 * |------|-----|-----|-----|-----|------|
 * | CO1  | 3   | 2   | 0   | ... | 1    |
 * | CO2  | 0   | 3   | 2   | ... | 0    |
 */
const uploadMatrix = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  // Check file uploaded
  if (!req.file) {
    throw ApiError.badRequest('Excel file is required');
  }
  
  const filePath = req.file.path;
  
  try {
    // Check course exists and ownership
    const course = await Course.findById(courseId);
    
    if (!course) {
      throw ApiError.notFound('Course not found');
    }
    
    if (req.user.role === 'faculty' && !course.isFacultyOwner(req.userId)) {
      throw ApiError.forbidden('You can only upload matrix for your own courses');
    }
    
    // Read Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
      throw ApiError.badRequest('Excel file has no sheets');
    }
    
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    if (data.length === 0) {
      throw ApiError.badRequest('Excel sheet is empty or has no data rows');
    }
    
    // Get COs for this course
    const cos = await CourseOutcome.findByCourse(courseId);
    const coMap = new Map(cos.map(co => [co.coNumber.toUpperCase(), co]));
    
    if (cos.length === 0) {
      throw ApiError.badRequest('No Course Outcomes defined for this course. Please add COs first.');
    }
    
    // Parse matrix data
    const rows = [];
    const errors = [];
    const warnings = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const coLabel = (row['CO'] || row['co'] || row['CO Number'] || '').toString().toUpperCase();
      
      if (!coLabel) {
        warnings.push({ row: i + 2, message: 'Missing CO number, skipping row' });
        continue;
      }
      
      // Find matching CO
      const co = coMap.get(coLabel);
      if (!co) {
        errors.push({ row: i + 2, message: `CO "${coLabel}" not found in course` });
        continue;
      }
      
      // Parse PO values
      const poValues = {};
      const poFields = ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12'];
      let hasValidValues = false;
      
      for (const po of poFields) {
        const value = row[po] || row[po.toLowerCase()] || row[po.toUpperCase()];
        const numValue = parseInt(value, 10);
        
        if (isNaN(numValue)) {
          poValues[po.toLowerCase()] = 0;
        } else if (numValue < 0 || numValue > 3) {
          errors.push({
            row: i + 2,
            message: `Invalid ${po} value: ${value}. Must be 0, 1, 2, or 3.`
          });
          continue;
        } else {
          poValues[po.toLowerCase()] = numValue;
          hasValidValues = true;
        }
      }
      
      if (!hasValidValues) {
        warnings.push({ row: i + 2, message: `All PO values are 0 for ${coLabel}` });
      }
      
      rows.push({
        coId: co._id,
        coNumber: co.coNumber,
        ...poValues
      });
    }
    
    // Check for missing COs (COs in DB but not in file)
    const uploadedCONumbers = new Set(rows.map(r => r.coNumber));
    const missingCOs = cos.filter(co => !uploadedCONumbers.has(co.coNumber));
    
    if (missingCOs.length > 0) {
      warnings.push({
        message: `Missing COs in upload: ${missingCOs.map(c => c.coNumber).join(', ')}`
      });
    }
    
    if (rows.length === 0) {
      throw ApiError.badRequest('No valid matrix data found in file', errors);
    }
    
    // Delete existing matrix
    await POMatrix.deleteOne({ courseId });
    
    // Create new matrix
    const matrix = await POMatrix.create({
      courseId,
      rows,
      updatedBy: req.userId
    });
    
    return ApiResponse.success(res, 200, 'CO-PO matrix uploaded successfully', {
      matrix,
      summary: {
        totalCOs: cos.length,
        uploadedRows: rows.length,
        missingCOs: missingCOs.length
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } finally {
    // Clean up uploaded file
    cleanupFile(filePath);
  }
});

/**
 * Get matrix template for download
 * GET /api/courses/:courseId/matrix/template
 */
const getMatrixTemplate = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  
  // Check course exists
  const course = await Course.findById(courseId);
  
  if (!course) {
    throw ApiError.notFound('Course not found');
  }
  
  // Get COs
  const cos = await CourseOutcome.findByCourse(courseId);
  
  // Create template data
  const templateData = [
    ['CO', 'PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12']
  ];
  
  // Add CO rows
  for (const co of cos) {
    templateData.push([co.coNumber, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  
  // Create workbook
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet(templateData);
  xlsx.utils.book_append_sheet(wb, ws, 'CO-PO Matrix');
  
  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // CO
    ...Array(12).fill({ wch: 6 })  // PO1-PO12
  ];
  
  // Write to buffer
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  // Send file
  res.setHeader('Content-Disposition', `attachment; filename="matrix_template_${course.courseCode}.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

module.exports = {
  createMatrix,
  getMatrix,
  uploadMatrix,
  getMatrixTemplate
};
