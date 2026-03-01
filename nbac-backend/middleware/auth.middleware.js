/**
 * Authentication Middleware
 * Verifies JWT access tokens and attaches user to request
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/apiError');

/**
 * Verify JWT access token
 * Attaches the authenticated user to req.user
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token required. Please login to continue.');
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw ApiError.unauthorized('Invalid token format. Please login again.');
    }
    
    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Access token expired. Please refresh your token.');
      }
      if (err.name === 'JsonWebTokenError') {
        throw ApiError.unauthorized('Invalid access token. Please login again.');
      }
      throw ApiError.unauthorized('Token verification failed. Please login again.');
    }
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    
    if (!user) {
      throw ApiError.unauthorized('User not found. Please login again.');
    }
    
    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact administrator.');
    }
    
    if (!user.isApproved) {
      throw ApiError.forbidden('Your account is pending approval. Please contact administrator.');
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional token verification - doesn't throw if no token
 * Useful for routes that work with or without authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
          const user = await User.findById(decoded.userId).select('-password -refreshToken');
          
          if (user && user.isActive && user.isApproved) {
            req.user = user;
            req.userId = user._id;
            req.userRole = user.role;
          }
        } catch (err) {
          // Silently continue without user
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyToken,
  optionalAuth
};
