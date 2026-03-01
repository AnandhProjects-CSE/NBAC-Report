/**
 * POMatrix Model
 * Stores CO-PO correlation matrix for each course
 * Each row represents a CO with its correlation values to POs (PO1-PO12)
 * Correlation values: 0 (none), 1 (low), 2 (medium), 3 (high)
 */

const mongoose = require('mongoose');

/**
 * Schema for a single matrix row (one CO's correlation to all POs)
 */
const matrixRowSchema = new mongoose.Schema({
  coId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseOutcome',
    required: true
  },
  coNumber: {
    type: String,
    required: true
  },
  // Correlation values for each PO (0-3 scale)
  po1: { type: Number, default: 0, min: 0, max: 3 },
  po2: { type: Number, default: 0, min: 0, max: 3 },
  po3: { type: Number, default: 0, min: 0, max: 3 },
  po4: { type: Number, default: 0, min: 0, max: 3 },
  po5: { type: Number, default: 0, min: 0, max: 3 },
  po6: { type: Number, default: 0, min: 0, max: 3 },
  po7: { type: Number, default: 0, min: 0, max: 3 },
  po8: { type: Number, default: 0, min: 0, max: 3 },
  po9: { type: Number, default: 0, min: 0, max: 3 },
  po10: { type: Number, default: 0, min: 0, max: 3 },
  po11: { type: Number, default: 0, min: 0, max: 3 },
  po12: { type: Number, default: 0, min: 0, max: 3 }
}, { _id: false });

const poMatrixSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required'],
    unique: true // One matrix per course
  },
  rows: [matrixRowSchema],
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

/**
 * Validate all correlation values are within 0-3 range
 */
matrixRowSchema.pre('validate', function(next) {
  const poFields = ['po1', 'po2', 'po3', 'po4', 'po5', 'po6', 'po7', 'po8', 'po9', 'po10', 'po11', 'po12'];
  
  for (const field of poFields) {
    const value = this[field];
    if (value !== undefined && (value < 0 || value > 3 || !Number.isInteger(value))) {
      return next(new Error(`${field} must be an integer between 0 and 3`));
    }
  }
  
  next();
});

/**
 * Method to get correlation values for a specific CO
 * @param {string} coId - Course Outcome ID
 * @returns {Object|null} Correlation values object
 */
poMatrixSchema.methods.getCorrelationByCO = function(coId) {
  return this.rows.find(row => row.coId.toString() === coId.toString());
};

/**
 * Method to get all COs mapped to a specific PO with non-zero correlation
 * @param {number} poNumber - PO number (1-12)
 * @returns {Array} Array of { coId, correlation } objects
 */
poMatrixSchema.methods.getCOsForPO = function(poNumber) {
  const poField = `po${poNumber}`;
  return this.rows
    .filter(row => row[poField] > 0)
    .map(row => ({
      coId: row.coId,
      coNumber: row.coNumber,
      correlation: row[poField]
    }));
};

/**
 * Static to find matrix by course
 * @param {string} courseId - Course ID
 * @returns {Query} Mongoose query
 */
poMatrixSchema.statics.findByCourse = function(courseId) {
  return this.findOne({ courseId }).populate('rows.coId', 'coNumber description');
};

/**
 * Convert matrix to a simple 2D array format for reports
 * @returns {Array<Array>} 2D array of correlation values
 */
poMatrixSchema.methods.toArray = function() {
  return this.rows.map(row => [
    row.po1, row.po2, row.po3, row.po4, row.po5, row.po6,
    row.po7, row.po8, row.po9, row.po10, row.po11, row.po12
  ]);
};

const POMatrix = mongoose.model('POMatrix', poMatrixSchema);

module.exports = POMatrix;
