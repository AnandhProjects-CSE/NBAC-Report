/**
 * Role-Based Access Control Middleware
 * Restricts route access based on user roles
 */

const ApiError = require('../utils/apiError');

/**
 * Allow access only to specified roles
 * Must be used after verifyToken middleware
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
const allowRoles = (...roles) => {
  return (req, res, next) => {
    // Check if user is attached to request
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    
    // Check if user's role is in allowed roles
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(
        `Access denied. This action requires one of the following roles: ${roles.join(', ')}`
      ));
    }
    
    next();
  };
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }
  
  if (req.user.role !== 'admin') {
    return next(ApiError.forbidden('Admin access required'));
  }
  
  next();
};

/**
 * Check if user is faculty
 */
const isFaculty = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }
  
  if (req.user.role !== 'faculty') {
    return next(ApiError.forbidden('Faculty access required'));
  }
  
  next();
};

/**
 * Check if user is student
 */
const isStudent = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }
  
  if (req.user.role !== 'student') {
    return next(ApiError.forbidden('Student access required'));
  }
  
  next();
};

/**
 * Check if user is admin or faculty
 */
const isAdminOrFaculty = (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required'));
  }
  
  if (!['admin', 'faculty'].includes(req.user.role)) {
    return next(ApiError.forbidden('Admin or Faculty access required'));
  }
  
  next();
};

/**
 * Check if user owns the resource or is admin
 * Used for course-specific operations
 * @param {Function} getResourceOwnerId - Async function to get resource owner ID
 * @returns {Function} Express middleware
 */
const isOwnerOrAdmin = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('Authentication required'));
      }
      
      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Get the owner ID of the resource
      const ownerId = await getResourceOwnerId(req);
      
      if (!ownerId) {
        return next(ApiError.notFound('Resource not found'));
      }
      
      // Check if user is the owner
      if (ownerId.toString() !== req.user._id.toString()) {
        return next(ApiError.forbidden('You do not have permission to access this resource'));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  allowRoles,
  isAdmin,
  isFaculty,
  isStudent,
  isAdminOrFaculty,
  isOwnerOrAdmin
};
