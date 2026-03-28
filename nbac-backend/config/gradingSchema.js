/**
 * NAAC Grading Schema Configuration
 * 
 * Maps overall attainment percentage to NAAC grade.
 * Edit this file to adjust grading thresholds without touching business logic.
 * 
 * Array must be in DESCENDING order of minPercentage.
 * 
 * Overall Attainment % = (averageCOAttainment / 3) × 100
 */

module.exports = [
    { grade: 'A++', minPercentage: 90 },
    { grade: 'A+', minPercentage: 85 },
    { grade: 'A', minPercentage: 80 },
    { grade: 'B++', minPercentage: 75 },
    { grade: 'B+', minPercentage: 70 },
    { grade: 'B', minPercentage: 60 },
    { grade: 'C', minPercentage: 0 },
];
