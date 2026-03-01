/**
 * Custom API Error Class
 * Extends the native Error class to include HTTP status codes
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a Bad Request error (400)
   */
  static badRequest(message = 'Bad Request', errors = []) {
    return new ApiError(400, message, errors);
  }

  /**
   * Create an Unauthorized error (401)
   */
  static unauthorized(message = 'Unauthorized access') {
    return new ApiError(401, message);
  }

  /**
   * Create a Forbidden error (403)
   */
  static forbidden(message = 'Forbidden - You do not have permission') {
    return new ApiError(403, message);
  }

  /**
   * Create a Not Found error (404)
   */
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  /**
   * Create a Conflict error (409)
   */
  static conflict(message = 'Resource conflict', errors = []) {
    return new ApiError(409, message, errors);
  }

  /**
   * Create an Unprocessable Entity error (422)
   */
  static unprocessableEntity(message = 'Validation failed', errors = []) {
    return new ApiError(422, message, errors);
  }

  /**
   * Create an Internal Server error (500)
   */
  static internal(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
