/**
 * Standardized API Response Helper
 * Provides consistent response structure across all endpoints
 */
class ApiResponse {
  /**
   * Send a success response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Success message
   * @param {Object} data - Response data
   * @param {Object} meta - Additional metadata (pagination, etc.)
   */
  static success(res, statusCode = 200, message = 'Success', data = {}, meta = null) {
    const response = {
      success: true,
      message,
      data
    };

    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send a created response (201)
   */
  static created(res, message = 'Resource created successfully', data = {}) {
    return this.success(res, 201, message, data);
  }

  /**
   * Send a success response with pagination
   */
  static paginated(res, message = 'Success', data = [], pagination = {}) {
    return this.success(res, 200, message, data, { pagination });
  }

  /**
   * Send a no content response (204)
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Send an error response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Array} errors - Array of field-level errors
   */
  static error(res, statusCode = 500, message = 'Internal server error', errors = []) {
    const response = {
      success: false,
      message
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;
