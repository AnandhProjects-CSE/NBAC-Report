/**
 * Feedback Model
 * Stores student feedback for courses with CO-wise ratings
 * One feedback submission per student per course
 */

const mongoose = require('mongoose');

/**
 * Schema for individual CO response
 */
const feedbackResponseSchema = new mongoose.Schema({
  coId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseOutcome',
    required: true
  },
  coNumber: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v);
      },
      message: 'Rating must be an integer'
    }
  }
}, { _id: false });

const feedbackSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required']
  },
  responses: [feedbackResponseSchema],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  // Additional comments (optional)
  comments: {
    type: String,
    trim: true,
    maxlength: [500, 'Comments cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound unique index: one feedback per student per course
feedbackSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

// Index for faster queries
feedbackSchema.index({ studentId: 1 });

/**
 * Static to check if student has submitted feedback for a course
 * @param {string} courseId - Course ID
 * @param {string} studentId - Student ID
 * @returns {Promise<boolean>} True if submitted
 */
feedbackSchema.statics.hasSubmitted = async function(courseId, studentId) {
  const count = await this.countDocuments({ courseId, studentId });
  return count > 0;
};

/**
 * Static to get all feedback for a course
 * @param {string} courseId - Course ID
 * @returns {Query} Mongoose query
 */
feedbackSchema.statics.findByCourse = function(courseId) {
  return this.find({ courseId }).populate('studentId', 'name rollNumber');
};

/**
 * Static to get feedback summary for a course (aggregated ratings per CO)
 * @param {string} courseId - Course ID
 * @returns {Promise<Array>} Aggregated feedback per CO
 */
feedbackSchema.statics.getSummaryByCourse = async function(courseId) {
  const feedbacks = await this.find({ courseId });
  
  if (feedbacks.length === 0) {
    return [];
  }
  
  // Aggregate ratings per CO
  const coRatings = {};
  
  for (const feedback of feedbacks) {
    for (const response of feedback.responses) {
      const coId = response.coId.toString();
      if (!coRatings[coId]) {
        coRatings[coId] = {
          coId: response.coId,
          coNumber: response.coNumber,
          ratings: [],
          count: 0
        };
      }
      coRatings[coId].ratings.push(response.rating);
      coRatings[coId].count++;
    }
  }
  
  // Calculate averages
  return Object.values(coRatings).map(co => ({
    coId: co.coId,
    coNumber: co.coNumber,
    averageRating: parseFloat((co.ratings.reduce((a, b) => a + b, 0) / co.ratings.length).toFixed(2)),
    totalResponses: co.count
  }));
};

/**
 * Static to get courses with feedback status for a student
 * @param {string} studentId - Student ID
 * @param {Array} enrolledCourseIds - Array of course IDs student is enrolled in
 * @returns {Promise<Array>} Courses with feedback status
 */
feedbackSchema.statics.getStudentFeedbackStatus = async function(studentId, enrolledCourseIds) {
  const submittedFeedbacks = await this.find({ 
    studentId,
    courseId: { $in: enrolledCourseIds }
  }).select('courseId submittedAt');
  
  const submittedCourseIds = new Set(
    submittedFeedbacks.map(f => f.courseId.toString())
  );
  
  return {
    submitted: submittedFeedbacks.map(f => ({
      courseId: f.courseId,
      submittedAt: f.submittedAt
    })),
    submittedCourseIds,
    pendingCourseIds: enrolledCourseIds.filter(
      id => !submittedCourseIds.has(id.toString())
    )
  };
};

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
