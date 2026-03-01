/**
 * User Model
 * Stores user information with role-based access control
 * Roles: admin, faculty, student
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Never return password in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'faculty', 'student'],
      message: 'Role must be either admin, faculty, or student'
    },
    required: [true, 'Role is required']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  // Student-specific fields
  year: {
    type: Number,
    min: [1, 'Year must be at least 1'],
    max: [4, 'Year cannot exceed 4'],
    required: function() {
      return this.role === 'student';
    }
  },
  section: {
    type: String,
    trim: true,
    uppercase: true,
    required: function() {
      return this.role === 'student';
    }
  },
  rollNumber: {
    type: String,
    trim: true,
    uppercase: true,
    sparse: true,
    unique: true
  },
  // Authentication fields
  refreshToken: {
    type: String,
    select: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: true // Set to false if self-registration with approval is enabled
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshToken;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for faster queries
userSchema.index({ role: 1, department: 1 });

/**
 * Pre-save middleware to hash password before saving
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare password for authentication
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} True if passwords match
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Static method to find user by email with password
 * @param {string} email - User email
 * @returns {Promise<User>} User document with password field
 */
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

/**
 * Method to generate a clean user object for responses
 * @returns {Object} User object without sensitive fields
 */
userSchema.methods.toSafeObject = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
