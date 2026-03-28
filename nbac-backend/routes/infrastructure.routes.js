/**
 * Infrastructure Feedback Routes
 * Handles student infrastructure ratings for Library, Transport, Canteen
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
    submitRating,
    updateRating,
    getMyRatings,
    getSummary,
    getAdminAnalytics
} = require('../controllers/infrastructure.controller');

// All routes require authentication
router.use(verifyToken);

// Student: Submit a new rating
router.post('/rate', submitRating);

// Student: Edit an existing rating
router.patch('/rate', updateRating);

// Student: Get own ratings for a semester/year
router.get('/my-ratings', getMyRatings);

// All roles: Get aggregated summary (filterable)
router.get('/summary', getSummary);

// Admin only: Detailed analytics
router.get('/admin', getAdminAnalytics);

module.exports = router;
