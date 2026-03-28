/**
 * Infrastructure Feedback Controller
 * Handles student infrastructure ratings (Library, Transport, Canteen)
 */

const InfrastructureFeedback = require('../models/InfrastructureFeedback.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const RATING_TYPES = ['LIBRARY', 'TRANSPORT', 'CANTEEN'];

/**
 * Submit infrastructure rating (student only)
 * POST /api/infrastructure/rate
 * Body: { ratingType, rating, semester, academicYear, department, comments? }
 */
const submitRating = asyncHandler(async (req, res) => {
    if (req.user.role !== 'student') {
        throw ApiError.forbidden('Only students can submit infrastructure ratings');
    }

    const { ratingType, rating, semester, academicYear, department, comments } = req.body;

    // Validate ratingType
    if (!RATING_TYPES.includes(ratingType)) {
        throw ApiError.badRequest(`ratingType must be one of: ${RATING_TYPES.join(', ')}`);
    }

    // Validate rating
    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
        throw ApiError.badRequest('Rating must be an integer between 1 and 5');
    }

    if (!semester || !academicYear || !department) {
        throw ApiError.badRequest('semester, academicYear, and department are required');
    }

    // Check for duplicate
    const alreadyRated = await InfrastructureFeedback.hasRated(
        req.userId, ratingType, Number(semester), academicYear
    );

    if (alreadyRated) {
        throw ApiError.conflict(`You have already rated ${ratingType} for semester ${semester} (${academicYear}). Use edit endpoint to update.`);
    }

    const feedback = await InfrastructureFeedback.create({
        studentId: req.userId,
        ratingType,
        rating: Number(rating),
        semester: Number(semester),
        academicYear,
        department,
        comments: comments || undefined
    });

    return ApiResponse.created(res, 'Infrastructure rating submitted successfully', { feedback });
});

/**
 * Edit/update existing infrastructure rating (student only)
 * PATCH /api/infrastructure/rate
 * Body: { ratingType, rating, semester, academicYear, comments? }
 */
const updateRating = asyncHandler(async (req, res) => {
    if (req.user.role !== 'student') {
        throw ApiError.forbidden('Only students can update infrastructure ratings');
    }

    const { ratingType, rating, semester, academicYear, comments } = req.body;

    if (!RATING_TYPES.includes(ratingType)) {
        throw ApiError.badRequest(`ratingType must be one of: ${RATING_TYPES.join(', ')}`);
    }

    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
        throw ApiError.badRequest('Rating must be an integer between 1 and 5');
    }

    const existing = await InfrastructureFeedback.findOne({
        studentId: req.userId,
        ratingType,
        semester: Number(semester),
        academicYear
    });

    if (!existing) {
        throw ApiError.notFound('No existing rating found. Submit a new rating first.');
    }

    existing.rating = Number(rating);
    if (comments !== undefined) existing.comments = comments;
    await existing.save();

    return ApiResponse.success(res, 200, 'Rating updated successfully', { feedback: existing });
});

/**
 * Get current student's infrastructure ratings for a period
 * GET /api/infrastructure/my-ratings?semester=1&academicYear=2024-25
 */
const getMyRatings = asyncHandler(async (req, res) => {
    if (req.user.role !== 'student') {
        throw ApiError.forbidden('This endpoint is for students only');
    }

    const { semester, academicYear } = req.query;

    if (!semester || !academicYear) {
        throw ApiError.badRequest('semester and academicYear query params are required');
    }

    const ratings = await InfrastructureFeedback.getStudentRatings(
        req.userId, Number(semester), academicYear
    );

    // Build a map so frontend can easily check per type
    const ratingMap = {};
    RATING_TYPES.forEach(type => { ratingMap[type] = null; });
    ratings.forEach(r => { ratingMap[r.ratingType] = r; });

    return ApiResponse.success(res, 200, 'Ratings retrieved', {
        ratings: ratingMap,
        totalSubmitted: ratings.length,
        totalTypes: RATING_TYPES.length
    });
});

/**
 * Get aggregated summary for all types (accessible by all authenticated users)
 * GET /api/infrastructure/summary?department=CSE&semester=1&academicYear=2024-25
 */
const getSummary = asyncHandler(async (req, res) => {
    const { department, semester, academicYear } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (academicYear) filter.academicYear = academicYear;

    const summary = await InfrastructureFeedback.getAggregatedSummary(filter);

    // Ensure all 3 types are present even if no data
    const result = RATING_TYPES.map(type => {
        const found = summary.find(s => s.ratingType === type);
        return found || { ratingType: type, averageRating: null, totalResponses: 0, ratingDistribution: [] };
    });

    return ApiResponse.success(res, 200, 'Infrastructure summary retrieved', { summary: result });
});

/**
 * Get admin-level analytics (admin only)
 * GET /api/infrastructure/admin?department=CSE&semester=1&academicYear=2024-25
 */
const getAdminAnalytics = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        throw ApiError.forbidden('Admin access required');
    }

    const { department, semester, academicYear } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (academicYear) filter.academicYear = academicYear;

    // Overall summary per type
    const typeSummary = await InfrastructureFeedback.getAggregatedSummary(filter);

    // Department-wise breakdown
    const deptBreakdown = await InfrastructureFeedback.aggregate([
        { $match: filter },
        {
            $group: {
                _id: { department: '$department', ratingType: '$ratingType' },
                averageRating: { $avg: '$rating' },
                totalResponses: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                department: '$_id.department',
                ratingType: '$_id.ratingType',
                averageRating: { $round: ['$averageRating', 2] },
                totalResponses: 1
            }
        },
        { $sort: { department: 1, ratingType: 1 } }
    ]);

    // Total unique respondents
    const totalRespondents = await InfrastructureFeedback.aggregate([
        { $match: filter },
        { $group: { _id: '$studentId' } },
        { $count: 'total' }
    ]);

    // Ensure all types in summary
    const result = RATING_TYPES.map(type => {
        const found = typeSummary.find(s => s.ratingType === type);
        return found || { ratingType: type, averageRating: null, totalResponses: 0, ratingDistribution: [] };
    });

    return ApiResponse.success(res, 200, 'Admin infrastructure analytics retrieved', {
        summary: result,
        departmentBreakdown: deptBreakdown,
        totalUniqueRespondents: totalRespondents[0]?.total || 0,
        appliedFilters: { department: department || 'all', semester: semester || 'all', academicYear: academicYear || 'all' }
    });
});

module.exports = {
    submitRating,
    updateRating,
    getMyRatings,
    getSummary,
    getAdminAnalytics
};
