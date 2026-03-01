/**
 * Course Model
 * Stores course information including faculty assignment and enrolled students
 */

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    trim: true,
    uppercase: true
  },
  courseName: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    maxlength: [200, 'Course name cannot exceed 200 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: [1, 'Semester must be at least 1'],
    max: [8, 'Semester cannot exceed 8']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{2}$/, 'Academic year must be in format YYYY-YY (e.g., 2024-25)']
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Faculty assignment is required']
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  credits: {
    type: Number,
    min: [1, 'Credits must be at least 1'],
    max: [10, 'Credits cannot exceed 10'],
    default: 3
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Compound index for unique course code per department + semester + academic year
courseSchema.index(
  { courseCode: 1, department: 1, semester: 1, academicYear: 1 },
  { unique: true }
);

// Index for faster queries
courseSchema.index({ facultyId: 1 });
courseSchema.index({ department: 1, semester: 1 });
courseSchema.index({ isActive: 1 });

/**
 * Method to check if a user is the faculty owner of this course
 * @param {string} userId - User ID to check
 * @returns {boolean} True if user is the faculty owner
 */
courseSchema.methods.isFacultyOwner = function(userId) {
  // Handle both populated and unpopulated facultyId
  const facultyIdStr = this.facultyId._id 
    ? this.facultyId._id.toString() 
    : this.facultyId.toString();
  return facultyIdStr === userId.toString();
};

/**
 * Method to check if a student is enrolled in this course
 * @param {string} studentId - Student ID to check
 * @returns {boolean} True if student is enrolled
 */
courseSchema.methods.isStudentEnrolled = function(studentId) {
  return this.enrolledStudents.some(student => {
    // Handle both populated and unpopulated student
    const studentIdStr = student._id 
      ? student._id.toString() 
      : student.toString();
    return studentIdStr === studentId.toString();
  });
};

/**
 * Static to get courses by faculty
 * @param {string} facultyId - Faculty ID
 * @returns {Query} Mongoose query
 */
courseSchema.statics.findByFaculty = function(facultyId) {
  return this.find({ facultyId, isActive: true });
};

/**
 * Static to get courses by department
 * @param {string} department - Department name
 * @returns {Query} Mongoose query
 */
courseSchema.statics.findByDepartment = function(department) {
  return this.find({ department, isActive: true });
};

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;