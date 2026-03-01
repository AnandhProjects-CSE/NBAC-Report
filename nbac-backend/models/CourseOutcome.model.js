/**
 * CourseOutcome (CO) Model
 * Stores Course Outcomes for each course with threshold for attainment
 */

const mongoose = require('mongoose');

const courseOutcomeSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  coNumber: {
    type: String,
    required: [true, 'CO number is required'],
    trim: true,
    uppercase: true,
    match: [/^CO[1-9]\d*$/, 'CO number must be in format CO1, CO2, etc.']
  },
  description: {
    type: String,
    required: [true, 'CO description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  threshold: {
    type: Number,
    default: 60,
    min: [0, 'Threshold cannot be negative'],
    max: [100, 'Threshold cannot exceed 100'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v);
      },
      message: 'Threshold must be an integer'
    }
  }
}, {
  timestamps: true
});

// Compound unique index: one CO number per course
courseOutcomeSchema.index({ courseId: 1, coNumber: 1 }, { unique: true });

/**
 * Static to get all COs for a course
 * @param {string} courseId - Course ID
 * @returns {Query} Mongoose query
 */
courseOutcomeSchema.statics.findByCourse = function(courseId) {
  return this.find({ courseId }).sort({ coNumber: 1 });
};

/**
 * Method to check if CO can be deleted (no marks or attainment linked)
 * This would require checking Marks and Attainment models
 */
courseOutcomeSchema.methods.canDelete = async function() {
  const Marks = mongoose.model('Marks');
  const Attainment = mongoose.model('Attainment');
  
  // Check if any marks are mapped to this CO
  const marksCount = await Marks.countDocuments({
    'records.questionWiseMarks.mappedCO': this._id
  });
  
  if (marksCount > 0) {
    return { canDelete: false, reason: 'Marks records reference this CO' };
  }
  
  // Check if attainment references this CO
  const attainmentCount = await Attainment.countDocuments({
    'coAttainments.coId': this._id
  });
  
  if (attainmentCount > 0) {
    return { canDelete: false, reason: 'Attainment records reference this CO' };
  }
  
  return { canDelete: true, reason: null };
};

const CourseOutcome = mongoose.model('CourseOutcome', courseOutcomeSchema);

module.exports = CourseOutcome;
