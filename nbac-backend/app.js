/**
 * Express Application Configuration
 * Sets up middleware, routes, and error handling
 */

const express = require('express');
const cors = require('cors');
const { validationResult } = require('express-validator');
const ApiError = require('./utils/apiError');
const ApiResponse = require('./utils/apiResponse');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const courseRoutes = require('./routes/course.routes');
const coRoutes = require('./routes/co.routes');
const matrixRoutes = require('./routes/matrix.routes');
const marksRoutes = require('./routes/marks.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const attainmentRoutes = require('./routes/attainment.routes');
const reportRoutes = require('./routes/report.routes');

// Create Express app
const app = express();

/**
 * Global Middleware
 */

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') 
    : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

app.get("/",(req,res)=>{
  res.status(200).json({
    success: true,
    message: 'NBAC Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NBAC Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'NBAC API - NBA Accreditation Data Management System',
    version: '1.0.0',
    endpoints: {
      auth: {
        description: 'Authentication endpoints',
        routes: [
          'POST /api/auth/register - Register new user (admin only)',
          'POST /api/auth/login - Login user',
          'POST /api/auth/refresh - Refresh access token',
          'POST /api/auth/logout - Logout user',
          'GET /api/auth/me - Get current user profile'
        ]
      },
      users: {
        description: 'User management endpoints',
        routes: [
          'GET /api/users - List all users (admin)',
          'GET /api/users/:id - Get user details (admin)',
          'PATCH /api/users/:id - Update user (admin)',
          'DELETE /api/users/:id - Soft delete user (admin)',
          'GET /api/users/students/unenrolled/:courseId - Get unenrolled students'
        ]
      },
      courses: {
        description: 'Course management endpoints',
        routes: [
          'POST /api/courses - Create course',
          'GET /api/courses - List courses',
          'GET /api/courses/:id - Get course details',
          'PATCH /api/courses/:id - Update course',
          'DELETE /api/courses/:id - Delete course (admin)',
          'POST /api/courses/:id/enroll - Enroll students',
          'DELETE /api/courses/:id/enroll/:studentId - Remove student'
        ]
      },
      cos: {
        description: 'Course Outcome endpoints',
        routes: [
          'POST /api/courses/:courseId/cos - Add CO',
          'GET /api/courses/:courseId/cos - List COs',
          'PATCH /api/courses/:courseId/cos/:coId - Update CO',
          'DELETE /api/courses/:courseId/cos/:coId - Delete CO'
        ]
      },
      matrix: {
        description: 'CO-PO Matrix endpoints',
        routes: [
          'POST /api/courses/:courseId/matrix - Create/update matrix',
          'GET /api/courses/:courseId/matrix - Get matrix',
          'POST /api/courses/:courseId/matrix/upload - Upload matrix Excel'
        ]
      },
      marks: {
        description: 'Marks upload endpoints',
        routes: [
          'POST /api/courses/:courseId/marks/upload - Upload marks Excel',
          'GET /api/courses/:courseId/marks - List marks records',
          'GET /api/courses/:courseId/marks/:marksId - Get marks details',
          'DELETE /api/courses/:courseId/marks/:marksId - Delete marks'
        ]
      },
      feedback: {
        description: 'Student feedback endpoints',
        routes: [
          'POST /api/feedback/:courseId - Submit feedback (student)',
          'GET /api/feedback/:courseId - Get all feedback',
          'GET /api/feedback/:courseId/summary - Get feedback summary',
          'GET /api/feedback/student/status - Get feedback status (student)'
        ]
      },
      attainment: {
        description: 'Attainment calculation endpoints',
        routes: [
          'POST /api/attainment/:courseId/calculate - Calculate attainment',
          'GET /api/attainment/:courseId - Get attainment results',
          'GET /api/attainment/department/summary - Department summary (admin)'
        ]
      },
      reports: {
        description: 'NBA Report endpoints',
        routes: [
          'GET /api/reports/:courseId/co - CO attainment report',
          'GET /api/reports/:courseId/po - PO attainment report',
          'GET /api/reports/:courseId/full - Full NBA report',
          'GET /api/reports/department - Department report (admin)'
        ]
      }
    }
  });
});

/**
 * Validation Error Handler
 * Processes express-validator errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg
    }));
    
    return ApiResponse.error(res, 400, 'Validation failed', formattedErrors);
  }
  
  next();
};

/**
 * Mount Routes
 */

// Auth routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Course routes
app.use('/api/courses', courseRoutes);

// CO routes (nested under courses)
app.use('/api/courses/:courseId/cos', coRoutes);

// Matrix routes (nested under courses)
app.use('/api/courses/:courseId/matrix', matrixRoutes);

// Marks routes (nested under courses)
app.use('/api/courses/:courseId/marks', marksRoutes);

// Feedback routes
app.use('/api/feedback', feedbackRoutes);

// Attainment routes
app.use('/api/attainment', attainmentRoutes);

// Report routes
app.use('/api/reports', reportRoutes);

app.get('/favicon.ico', (req, res) => res.status(204).end());

/**
 * 404 Handler
 * Catches all unmatched routes
 */
app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.path} not found`));
});

/**
 * Global Error Handler
 * Processes all errors and returns standardized responses
 */
app.use((err, req, res, next) => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
    console.error('Stack:', err.stack);
  }
  
  // Handle known error types
  
  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return ApiResponse.error(res, 400, 'Invalid ID format', [{
      field: err.path,
      message: `Invalid ${err.kind}: ${err.value}`
    }]);
  }
  
  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return ApiResponse.error(res, 400, 'Validation failed', errors);
  }
  
  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return ApiResponse.error(res, 409, `Duplicate value for ${field}`, [{
      field,
      message: `${field} "${value}" already exists`
    }]);
  }
  
  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 401, 'Invalid token');
  }
  
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 401, 'Token expired');
  }
  
  // Multer Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const maxSizeMB = process.env.MAX_FILE_SIZE_MB || 5;
    return ApiResponse.error(res, 400, `File too large. Maximum size is ${maxSizeMB}MB`);
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return ApiResponse.error(res, 400, 'Unexpected file field');
  }
  
  // ApiError instances
  if (err instanceof ApiError) {
    return ApiResponse.error(res, err.statusCode, err.message, err.errors);
  }
  
  // Default server error
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message || 'Internal server error';
  
  return ApiResponse.error(res, statusCode, message);
});

module.exports = app;
