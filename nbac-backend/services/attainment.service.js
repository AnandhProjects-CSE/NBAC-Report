/**
 * Attainment Calculation Service
 * Core NBA calculation logic for CO and PO attainment
 * 
 * This is a pure, isolated module - no Express req/res dependencies
 * All calculations follow NBA OBE guidelines
 */

const mongoose = require('mongoose');
const Course = require('../models/Course.model');
const CourseOutcome = require('../models/CourseOutcome.model');
const POMatrix = require('../models/POMatrix.model');
const Marks = require('../models/Marks.model');
const Feedback = require('../models/Feedback.model');
const Attainment = require('../models/Attainment.model');

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
 * Step 1: Calculate Success Percentage per CO (from Marks)
 * 
 * For each CO:
 * - Sum marksObtained for all questions mapped to that CO for each student
 * - Sum maxMarks for all questions mapped to that CO
 * - Calculate student's CO score % = (marksObtained / maxMarks) * 100
 * - Student "attains" CO if score % >= threshold (default 60%)
 * - Success Percentage = (students attained / total students) * 100
 * 
 * @param {string} courseId - Course ID
 * @param {Array} cos - Course Outcomes with threshold
 * @param {Array} marksRecords - All marks records for the course
 * @returns {Object} CO-wise success percentages and student data
 */
const calculateSuccessPercentage = (courseId, cos, marksRecords) => {
  const coData = {};
  
  // Initialize CO data
  cos.forEach(co => {
    coData[co._id.toString()] = {
      coId: co._id,
      coNumber: co.coNumber,
      description: co.description,
      threshold: co.threshold,
      students: {} // studentId -> { obtained, max }
    };
  });
  
  // Process all marks records
  for (const record of marksRecords) {
    for (const studentRecord of record.records) {
      const studentId = studentRecord.studentId.toString();
      
      for (const qm of studentRecord.questionWiseMarks) {
        const coId = qm.mappedCO.toString();
        
        if (!coData[coId]) {
          // CO not found, skip
          continue;
        }
        
        if (!coData[coId].students[studentId]) {
          coData[coId].students[studentId] = { obtained: 0, max: 0 };
        }
        
        coData[coId].students[studentId].obtained += qm.marksObtained;
        coData[coId].students[studentId].max += qm.maxMarks;
      }
    }
  }
  
  // Calculate success percentage for each CO
  const results = [];
  
  for (const [coId, data] of Object.entries(coData)) {
    const studentIds = Object.keys(data.students);
    const totalStudents = studentIds.length;
    
    if (totalStudents === 0) {
      results.push({
        coId: data.coId,
        coNumber: data.coNumber,
        description: data.description,
        threshold: data.threshold,
        successPercentage: 0,
        studentsAttained: 0,
        totalStudents: 0,
        hasMarks: false
      });
      continue;
    }
    
    // Count students who attained
    let studentsAttained = 0;
    
    for (const studentId of studentIds) {
      const studentData = data.students[studentId];
      const scorePercentage = (studentData.obtained / studentData.max) * 100;
      
      if (scorePercentage >= data.threshold) {
        studentsAttained++;
      }
    }
    
    const successPercentage = (studentsAttained / totalStudents) * 100;
    
    results.push({
      coId: data.coId,
      coNumber: data.coNumber,
      description: data.description,
      threshold: data.threshold,
      successPercentage: parseFloat(successPercentage.toFixed(2)),
      studentsAttained,
      totalStudents,
      hasMarks: true
    });
  }
  
  return results;
};

/**
 * Step 2: Convert Success Percentage to Direct Attainment Level
 * 
 * Scale:
 * - Success % >= 70% → Direct Attainment = 3
 * - Success % >= 60% and < 70% → Direct Attainment = 2
 * - Success % >= 50% and < 60% → Direct Attainment = 1
 * - Success % < 50% → Direct Attainment = 0
 * 
 * @param {number} successPercentage - Success percentage (0-100)
 * @returns {number} Direct attainment level (0-3)
 */
const calculateDirectAttainment = (successPercentage) => {
  if (successPercentage >= 70) return 3;
  if (successPercentage >= 60) return 2;
  if (successPercentage >= 50) return 1;
  return 0;
};

/**
 * Step 3: Calculate Indirect Attainment per CO (from Feedback)
 * 
 * Average all student feedback ratings for each CO.
 * Feedback scale: 1-5. Normalize to attainment (0-3):
 * - Average Rating >= 4.5 → Indirect Attainment = 3
 * - Average Rating >= 3.5 → Indirect Attainment = 2
 * - Average Rating >= 2.5 → Indirect Attainment = 1
 * - Average Rating < 2.5 → Indirect Attainment = 0
 * 
 * @param {string} courseId - Course ID
 * @param {Array} cos - Course Outcomes
 * @returns {Object} CO-wise indirect attainment data
 */
const calculateIndirectAttainment = async (courseId, cos) => {
  // Get feedback summary
  const feedbackSummary = await Feedback.getSummaryByCourse(courseId);
  
  // Create map for quick lookup
  const feedbackMap = new Map();
  feedbackSummary.forEach(f => {
    feedbackMap.set(f.coId.toString(), f);
  });
  
  // Get total feedback count
  const totalFeedbackCount = await Feedback.countDocuments({ courseId });
  
  const results = [];
  
  for (const co of cos) {
    const feedback = feedbackMap.get(co._id.toString());
    
    if (!feedback || feedback.totalResponses === 0) {
      results.push({
        coId: co._id,
        coNumber: co.coNumber,
        averageRating: 0,
        totalResponses: 0,
        indirectAttainment: 0,
        hasFeedback: false
      });
      continue;
    }
    
    const avgRating = feedback.averageRating;
    let indirectAttainment = 0;
    
    if (avgRating >= 4.5) indirectAttainment = 3;
    else if (avgRating >= 3.5) indirectAttainment = 2;
    else if (avgRating >= 2.5) indirectAttainment = 1;
    else indirectAttainment = 0;
    
    results.push({
      coId: co._id,
      coNumber: co.coNumber,
      averageRating: avgRating,
      totalResponses: feedback.totalResponses,
      indirectAttainment,
      hasFeedback: true
    });
  }
  
  return {
    coIndirectAttainment: results,
    totalFeedbackCount
  };
};

/**
 * Step 4: Calculate Final CO Attainment
 * 
 * Final CO Attainment = (0.75 × Direct Attainment) + (0.25 × Indirect Attainment)
 * Round to 2 decimal places.
 * 
 * @param {number} directAttainment - Direct attainment level (0-3)
 * @param {number} indirectAttainment - Indirect attainment level (0-3)
 * @returns {number} Final attainment value (0-3)
 */
const calculateFinalCOAttainment = (directAttainment, indirectAttainment) => {
  const final = (0.75 * directAttainment) + (0.25 * indirectAttainment);
  return parseFloat(final.toFixed(2));
};

/**
 * Step 5: Calculate PO Attainment
 * 
 * For each PO (PO1-PO12):
 * - Only consider COs with non-zero correlation (correlation > 0)
 * - For each CO: contribution = Final CO Attainment × correlation value
 * - PO Attainment = sum of contributions / sum of correlation values (weighted average)
 * - Round to 2 decimal places
 * - If no COs map to a PO, attainmentValue = null (not applicable)
 * 
 * @param {Array} coAttainments - CO attainments with coId, coNumber, finalAttainment
 * @param {Object} poMatrix - CO-PO matrix with rows
 * @returns {Array} PO attainments
 */
const calculatePOAttainment = (coAttainments, poMatrix) => {
  const poAttainments = [];
  
  // Debug: Log matrix structure
  console.log('=== PO Attainment Calculation Debug ===');
  console.log('Matrix rows count:', poMatrix.rows.length);
  console.log('CO Attainments count:', coAttainments.length);
  console.log('CO Attainment IDs:', coAttainments.map(ca => ca.coId.toString()));
  
  for (let poNum = 1; poNum <= 12; poNum++) {
    const poNumber = `PO${poNum}`;
    const poField = `po${poNum}`;
    
    let totalContribution = 0;
    let totalCorrelation = 0;
    let contributingCOs = 0;
    
    // For each row in matrix, get correlation and find corresponding CO attainment
    for (const row of poMatrix.rows) {
      const correlation = row[poField];
      
      // Debug: Log row data
      if (poNum === 1) {
        console.log(`Row: coId=${row.coId}, type=${typeof row.coId}, isObject=${row.coId && typeof row.coId === 'object'}`);
        if (row.coId && typeof row.coId === 'object') {
          console.log(`  coId._id=${row.coId._id}, coId.coNumber=${row.coId.coNumber}`);
        }
        console.log(`  PO1 value: ${correlation}`);
      }
      
      if (correlation > 0) {
        // Handle both populated and unpopulated coId
        let rowCoIdStr;
        if (row.coId && typeof row.coId === 'object' && row.coId._id) {
          rowCoIdStr = row.coId._id.toString();
        } else if (row.coId) {
          rowCoIdStr = row.coId.toString();
        } else {
          console.log(`  Skipping row - coId is null/undefined`);
          continue;
        }
        
        // Find CO attainment
        const coAttainment = coAttainments.find(
          ca => ca.coId.toString() === rowCoIdStr
        );
        
        console.log(`  Looking for coId ${rowCoIdStr}, found: ${coAttainment ? 'YES' : 'NO'}`);
        
        if (coAttainment && coAttainment.finalAttainment !== null) {
          totalContribution += coAttainment.finalAttainment * correlation;
          totalCorrelation += correlation;
          contributingCOs++;
          console.log(`  Match found! CO=${coAttainment.coNumber}, attainment=${coAttainment.finalAttainment}, correlation=${correlation}`);
        }
      }
    }
    
    let attainmentValue = null;
    if (totalCorrelation > 0) {
      attainmentValue = parseFloat((totalContribution / totalCorrelation).toFixed(2));
    }
    
    poAttainments.push({
      poNumber,
      poName: PO_NAMES[poNumber],
      attainmentValue,
      contributingCOs,
      totalCorrelationWeight: totalCorrelation
    });
  }
  
  console.log('=== End Debug ===');
  
  return poAttainments;
};

/**
 * Main Calculation Function
 * Calculates complete attainment for a course
 * 
 * @param {string} courseId - Course ID
 * @param {string} generatedBy - User ID who triggered calculation
 * @returns {Object} Complete attainment results with warnings
 */
const calculateAttainment = async (courseId, generatedBy) => {
  const warnings = [];
  
  // Validate courseId
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    throw new Error('Invalid course ID format');
  }
  
  // Get course
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }
  
  // Get COs
  const cos = await CourseOutcome.findByCourse(courseId);
  if (cos.length === 0) {
    throw new Error('No Course Outcomes defined for this course.');
  }
  
  // Get marks records
  const marksRecords = await Marks.findByCourse(courseId).lean();
  if (marksRecords.length === 0) {
    throw new Error('Marks not uploaded. Cannot calculate attainment.');
  }
  
  // Get CO-PO matrix
  const poMatrix = await POMatrix.findByCourse(courseId);
  if (!poMatrix) {
    throw new Error('CO-PO matrix not defined.');
  }
  
  // Step 1: Calculate success percentages
  const successData = calculateSuccessPercentage(courseId, cos, marksRecords);
  
  // Check for COs without marks
  const cosWithoutMarks = successData.filter(s => !s.hasMarks);
  if (cosWithoutMarks.length > 0) {
    warnings.push(`COs without marks data: ${cosWithoutMarks.map(c => c.coNumber).join(', ')}`);
  }
  
  // Step 2 & 3: Calculate direct and indirect attainment
  const indirectData = await calculateIndirectAttainment(courseId, cos);
  
  // Check feedback count
  if (indirectData.totalFeedbackCount > 0 && indirectData.totalFeedbackCount < 5) {
    warnings.push('Indirect attainment may not be statistically significant (fewer than 5 feedback responses).');
  }
  
  // Combine data and calculate final CO attainment
  const coAttainments = successData.map(sd => {
    const indirect = indirectData.coIndirectAttainment.find(
      i => i.coId.toString() === sd.coId.toString()
    );
    
    const directAttainment = calculateDirectAttainment(sd.successPercentage);
    const indirectAttainment = indirect?.indirectAttainment || 0;
    const finalAttainment = calculateFinalCOAttainment(directAttainment, indirectAttainment);
    
    return {
      coId: sd.coId,
      coNumber: sd.coNumber,
      description: sd.description,
      successPercentage: sd.successPercentage,
      directAttainment,
      indirectAttainment,
      finalAttainment,
      studentsAttained: sd.studentsAttained,
      totalStudents: sd.totalStudents,
      averageFeedbackRating: indirect?.averageRating || null
    };
  });
  
  // Step 5: Calculate PO attainment
  const poAttainments = calculatePOAttainment(coAttainments, poMatrix);
  
  // Calculate summary statistics
  const totalCOs = coAttainments.length;
  const averageCOAttainment = coAttainments.length > 0
    ? parseFloat((coAttainments.reduce((sum, ca) => sum + ca.finalAttainment, 0) / coAttainments.length).toFixed(2))
    : 0;
  
  const poAttainmentValues = poAttainments.filter(pa => pa.attainmentValue !== null);
  const averagePOAttainment = poAttainmentValues.length > 0
    ? parseFloat((poAttainmentValues.reduce((sum, pa) => sum + pa.attainmentValue, 0) / poAttainmentValues.length).toFixed(2))
    : 0;
  
  const totalStudents = marksRecords.length > 0
    ? new Set(marksRecords.flatMap(r => r.records.map(rec => rec.studentId.toString()))).size
    : 0;
  
  // Delete existing attainment if any
  await Attainment.deleteOne({ courseId });
  
  // Create attainment record
  const attainment = await Attainment.create({
    courseId,
    coAttainments,
    poAttainments,
    generatedBy,
    warnings: warnings.length > 0 ? warnings : undefined,
    summary: {
      totalCOs,
      averageCOAttainment,
      averagePOAttainment,
      totalStudents,
      totalFeedbackResponses: indirectData.totalFeedbackCount
    }
  });
  
  // Mark marks records as processed
  await Marks.updateMany(
    { courseId },
    { isProcessed: true }
  );
  
  return {
    attainment,
    warnings
  };
};

/**
 * Get existing attainment for a course
 * 
 * @param {string} courseId - Course ID
 * @returns {Object|null} Attainment document
 */
const getAttainment = async (courseId) => {
  return Attainment.findByCourse(courseId)
    .populate('generatedBy', 'name email')
    .populate('coAttainments.coId', 'coNumber description');
};

/**
 * Get department-level PO attainment summary
 * 
 * @param {string} department - Department name
 * @param {string} academicYear - Optional academic year filter
 * @returns {Object} Department summary
 */
const getDepartmentSummary = async (department, academicYear = null) => {
  return Attainment.getDepartmentSummary(department, academicYear);
};

/**
 * Clear attainment data for a course
 * 
 * @param {string} courseId - Course ID
 * @returns {boolean} Success
 */
const clearAttainment = async (courseId) => {
  const result = await Attainment.deleteOne({ courseId });
  return result.deletedCount > 0;
};

module.exports = {
  calculateAttainment,
  getAttainment,
  getDepartmentSummary,
  clearAttainment,
  // Export individual functions for testing
  calculateSuccessPercentage,
  calculateDirectAttainment,
  calculateIndirectAttainment,
  calculateFinalCOAttainment,
  calculatePOAttainment,
  PO_NAMES
};
