/**
 * Marks Model
 * Stores uploaded marks for courses with question-wise CO mapping
 * Supports multiple assessment types: internal1, internal2, assignment, external
 */

const mongoose = require('mongoose');

/**
 * Schema for individual question marks
 */
const questionMarksSchema = new mongoose.Schema({
  questionNo: {
    type: String,
    required: true,
    trim: true
  },
  marksObtained: {
    type: Number,
    required: true,
    min: [0, 'Marks obtained cannot be negative']
  },
  maxMarks: {
    type: Number,
    required: true,
    min: [1, 'Max marks must be at least 1']
  },
  mappedCO: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseOutcome',
    required: true
  }
}, { _id: false });

/**
 * Schema for student record in marks upload
 */
const studentRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rollNumber: {
    type: String,
    trim: true
  },
  questionWiseMarks: [questionMarksSchema]
}, { _id: false });

const marksSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploaded by is required']
  },
  assessmentType: {
    type: String,
    enum: {
      values: ['internal1', 'internal2', 'assignment', 'external'],
      message: 'Assessment type must be internal1, internal2, assignment, or external'
    },
    required: [true, 'Assessment type is required']
  },
  records: [studentRecordSchema],
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  // Store original file info for reference
  originalFileName: {
    type: String
  },
  totalMaxMarks: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound unique index: one marks record per assessment type per course
marksSchema.index({ courseId: 1, assessmentType: 1 }, { unique: true });

// Index for faster queries
marksSchema.index({ uploadedBy: 1 });
marksSchema.index({ isProcessed: 1 });

/**
 * Pre-save validation to ensure marks don't exceed max marks
 */
marksSchema.pre('save', function(next) {
  for (const record of this.records) {
    for (const qm of record.questionWiseMarks) {
      if (qm.marksObtained > qm.maxMarks) {
        return next(new Error(
          `Marks obtained (${qm.marksObtained}) cannot exceed max marks (${qm.maxMarks}) for question ${qm.questionNo}`
        ));
      }
    }
  }
  next();
});

/**
 * Calculate total max marks from all questions
 */
marksSchema.methods.calculateTotalMaxMarks = function() {
  if (this.records.length === 0) return 0;
  
  const questionMaxMarks = {};
  for (const record of this.records) {
    for (const qm of record.questionWiseMarks) {
      questionMaxMarks[qm.questionNo] = qm.maxMarks;
    }
  }
  
  return Object.values(questionMaxMarks).reduce((sum, max) => sum + max, 0);
};

/**
 * Static to get all marks for a course
 * @param {string} courseId - Course ID
 * @returns {Query} Mongoose query
 */
marksSchema.statics.findByCourse = function(courseId) {
  return this.find({ courseId }).sort({ assessmentType: 1 });
};

/**
 * Static to get marks by assessment type
 * @param {string} courseId - Course ID
 * @param {string} assessmentType - Assessment type
 * @returns {Query} Mongoose query
 */
marksSchema.statics.findByAssessmentType = function(courseId, assessmentType) {
  return this.findOne({ courseId, assessmentType });
};

/**
 * Static to check if assessment type exists for a course
 * @param {string} courseId - Course ID
 * @param {string} assessmentType - Assessment type
 * @returns {Promise<boolean>} True if exists
 */
marksSchema.statics.assessmentExists = async function(courseId, assessmentType) {
  const count = await this.countDocuments({ courseId, assessmentType });
  return count > 0;
};

/**
 * Get unique COs that are mapped in this marks record
 * @returns {Array} Array of CO IDs
 */
marksSchema.methods.getMappedCOs = function() {
  const coSet = new Set();
  for (const record of this.records) {
    for (const qm of record.questionWiseMarks) {
      coSet.add(qm.mappedCO.toString());
    }
  }
  return Array.from(coSet);
};

const Marks = mongoose.model('Marks', marksSchema);

module.exports = Marks;
