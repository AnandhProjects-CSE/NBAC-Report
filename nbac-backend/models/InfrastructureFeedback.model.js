/**
 * InfrastructureFeedback Model
 * Stores student ratings for institutional infrastructure facilities
 * One rating per student per ratingType per semester per academicYear
 */

const mongoose = require('mongoose');

const RATING_TYPES = ['LIBRARY', 'TRANSPORT', 'CANTEEN'];

const infrastructureFeedbackSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Student ID is required']
    },
    ratingType: {
        type: String,
        enum: {
            values: RATING_TYPES,
            message: 'Rating type must be LIBRARY, TRANSPORT, or CANTEEN'
        },
        required: [true, 'Rating type is required']
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
        validate: {
            validator: Number.isInteger,
            message: 'Rating must be an integer'
        }
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
        match: [/^\d{4}-\d{2}$/, 'Academic year must be in format YYYY-YY']
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true
    },
    comments: {
        type: String,
        trim: true,
        maxlength: [300, 'Comments cannot exceed 300 characters']
    }
}, {
    timestamps: true
});

// Prevent duplicate submissions: one rating per student per type per semester+year
infrastructureFeedbackSchema.index(
    { studentId: 1, ratingType: 1, semester: 1, academicYear: 1 },
    { unique: true }
);

// Index for admin queries
infrastructureFeedbackSchema.index({ department: 1, semester: 1, academicYear: 1 });
infrastructureFeedbackSchema.index({ ratingType: 1 });

/**
 * Static to check if student already rated a facility this period
 */
infrastructureFeedbackSchema.statics.hasRated = async function (studentId, ratingType, semester, academicYear) {
    const count = await this.countDocuments({ studentId, ratingType, semester, academicYear });
    return count > 0;
};

/**
 * Static to get all ratings by a student for a given period
 */
infrastructureFeedbackSchema.statics.getStudentRatings = async function (studentId, semester, academicYear) {
    return this.find({ studentId, semester, academicYear }).lean();
};

/**
 * Static to get aggregated summary per ratingType (optionally filtered)
 */
infrastructureFeedbackSchema.statics.getAggregatedSummary = async function (filter = {}) {
    return this.aggregate([
        { $match: filter },
        {
            $group: {
                _id: '$ratingType',
                averageRating: { $avg: '$rating' },
                totalResponses: { $sum: 1 },
                ratingDistribution: {
                    $push: '$rating'
                }
            }
        },
        {
            $project: {
                _id: 0,
                ratingType: '$_id',
                averageRating: { $round: ['$averageRating', 2] },
                totalResponses: 1,
                ratingDistribution: 1
            }
        },
        { $sort: { ratingType: 1 } }
    ]);
};

const InfrastructureFeedback = mongoose.model('InfrastructureFeedback', infrastructureFeedbackSchema);

module.exports = InfrastructureFeedback;
