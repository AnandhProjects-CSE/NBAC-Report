/**
 * Database Seed Script
 * Run this script to populate initial data for testing
 * 
 * Usage: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User.model');
const Course = require('./models/Course.model');
const CourseOutcome = require('./models/CourseOutcome.model');
const POMatrix = require('./models/POMatrix.model');
const Marks = require('./models/Marks.model');
const Feedback = require('./models/Feedback.model');
const Attainment = require('./models/Attainment.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/NBAC_P1';
const SALT_ROUNDS = 12;

const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

const clearDatabase = async () => {
  console.log('Clearing database...');
  await User.deleteMany({});
  await Course.deleteMany({});
  await CourseOutcome.deleteMany({});
  await POMatrix.deleteMany({});
  await Marks.deleteMany({});
  await Feedback.deleteMany({});
  await Attainment.deleteMany({});
  console.log('Database cleared!');
};

const seedUsers = async () => {
  console.log('Seeding users...');
  
  const users = [
    {
      name: 'Admin User',
      email: 'admin@nbac.edu',
      password: await hashPassword('admin123'),
      role: 'admin',
      department: 'Computer Science',
      isActive: true,
      isApproved: true
    },
    {
      name: 'Dr. John Smith',
      email: 'john.smith@nbac.edu',
      password: await hashPassword('faculty123'),
      role: 'faculty',
      department: 'Computer Science',
      isActive: true,
      isApproved: true
    },
    {
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@nbac.edu',
      password: await hashPassword('faculty123'),
      role: 'faculty',
      department: 'Computer Science',
      isActive: true,
      isApproved: true
    },
    {
      name: 'Rahul Kumar',
      email: 'rahul.kumar@nbac.edu',
      password: await hashPassword('student123'),
      role: 'student',
      department: 'Computer Science',
      year: 3,
      section: 'A',
      rollNumber: '22CS101',
      isActive: true,
      isApproved: true
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@nbac.edu',
      password: await hashPassword('student123'),
      role: 'student',
      department: 'Computer Science',
      year: 3,
      section: 'A',
      rollNumber: '22CS102',
      isActive: true,
      isApproved: true
    },
    {
      name: 'Amit Patel',
      email: 'amit.patel@nbac.edu',
      password: await hashPassword('student123'),
      role: 'student',
      department: 'Computer Science',
      year: 3,
      section: 'A',
      rollNumber: '22CS103',
      isActive: true,
      isApproved: true
    },
    {
      name: 'Sneha Gupta',
      email: 'sneha.gupta@nbac.edu',
      password: await hashPassword('student123'),
      role: 'student',
      department: 'Computer Science',
      year: 3,
      section: 'A',
      rollNumber: '22CS104',
      isActive: true,
      isApproved: true
    },
    {
      name: 'Vikram Singh',
      email: 'vikram.singh@nbac.edu',
      password: await hashPassword('student123'),
      role: 'student',
      department: 'Computer Science',
      year: 3,
      section: 'A',
      rollNumber: '22CS105',
      isActive: true,
      isApproved: true
    }
  ];
  
  const createdUsers = await User.insertMany(users);
  console.log(`Created ${createdUsers.length} users`);
  
  return {
    admin: createdUsers[0],
    faculty: createdUsers[1],
    faculty2: createdUsers[2],
    students: createdUsers.slice(3)
  };
};

const seedCourses = async (faculty, students) => {
  console.log('Seeding courses...');
  
  const courses = [
    {
      courseCode: 'CS301',
      courseName: 'Data Structures and Algorithms',
      department: 'Computer Science',
      semester: 5,
      academicYear: '2024-25',
      facultyId: faculty._id,
      enrolledStudents: students.map(s => s._id),
      credits: 4,
      description: 'Study of fundamental data structures and algorithm design techniques',
      isActive: true
    },
    {
      courseCode: 'CS302',
      courseName: 'Database Management Systems',
      department: 'Computer Science',
      semester: 5,
      academicYear: '2024-25',
      facultyId: faculty._id,
      enrolledStudents: students.map(s => s._id),
      credits: 3,
      description: 'Introduction to database design, SQL, and transaction management',
      isActive: true
    }
  ];
  
  const createdCourses = await Course.insertMany(courses);
  console.log(`Created ${createdCourses.length} courses`);
  
  return createdCourses;
};

const seedCourseOutcomes = async (courses) => {
  console.log('Seeding course outcomes...');
  
  const outcomes = [
    { courseId: courses[0]._id, coNumber: 'CO1', description: 'Analyze the complexity of algorithms using asymptotic notation', threshold: 60 },
    { courseId: courses[0]._id, coNumber: 'CO2', description: 'Implement and evaluate various data structures including arrays, linked lists, stacks, and queues', threshold: 60 },
    { courseId: courses[0]._id, coNumber: 'CO3', description: 'Apply tree and graph data structures to solve real-world problems', threshold: 60 },
    { courseId: courses[0]._id, coNumber: 'CO4', description: 'Design and implement efficient sorting and searching algorithms', threshold: 60 },
    { courseId: courses[0]._id, coNumber: 'CO5', description: 'Evaluate algorithm efficiency and optimize code performance', threshold: 60 },
    { courseId: courses[1]._id, coNumber: 'CO1', description: 'Design relational databases using ER modeling and normalization', threshold: 60 },
    { courseId: courses[1]._id, coNumber: 'CO2', description: 'Write complex SQL queries for data manipulation and retrieval', threshold: 60 },
    { courseId: courses[1]._id, coNumber: 'CO3', description: 'Implement transaction management and concurrency control', threshold: 60 },
    { courseId: courses[1]._id, coNumber: 'CO4', description: 'Apply database security and integrity constraints', threshold: 60 }
  ];
  
  const createdOutcomes = await CourseOutcome.insertMany(outcomes);
  console.log(`Created ${createdOutcomes.length} course outcomes`);
  
  return createdOutcomes;
};

const seedPOMatrix = async (courses, outcomes, faculty) => {
  console.log('Seeding CO-PO matrices...');
  
  const cs301Outcomes = outcomes.filter(o => o.courseId.toString() === courses[0]._id.toString());
  const cs302Outcomes = outcomes.filter(o => o.courseId.toString() === courses[1]._id.toString());
  
  const correlations301 = [
    { po1: 3, po2: 3, po3: 2, po4: 1, po5: 2, po6: 0, po7: 0, po8: 0, po9: 1, po10: 1, po11: 0, po12: 2 },
    { po1: 3, po2: 2, po3: 3, po4: 2, po5: 3, po6: 0, po7: 0, po8: 0, po9: 2, po10: 1, po11: 1, po12: 1 },
    { po1: 2, po2: 3, po3: 3, po4: 3, po5: 2, po6: 1, po7: 1, po8: 0, po9: 2, po10: 2, po11: 1, po12: 2 },
    { po1: 3, po2: 3, po3: 2, po4: 2, po5: 3, po6: 0, po7: 0, po8: 0, po9: 1, po10: 1, po11: 0, po12: 1 },
    { po1: 2, po2: 3, po3: 2, po4: 3, po5: 3, po6: 1, po7: 1, po8: 1, po9: 1, po10: 2, po11: 2, po12: 3 }
  ];
  
  const correlations302 = [
    { po1: 3, po2: 2, po3: 3, po4: 1, po5: 2, po6: 0, po7: 0, po8: 0, po9: 1, po10: 2, po11: 1, po12: 1 },
    { po1: 3, po2: 2, po3: 2, po4: 2, po5: 3, po6: 0, po7: 0, po8: 0, po9: 1, po10: 2, po11: 0, po12: 1 },
    { po1: 2, po2: 3, po3: 2, po4: 3, po5: 2, po6: 0, po7: 0, po8: 1, po9: 1, po10: 1, po11: 2, po12: 1 },
    { po1: 2, po2: 2, po3: 2, po4: 2, po5: 2, po6: 1, po7: 1, po8: 3, po9: 1, po10: 1, po11: 1, po12: 1 }
  ];
  
  const matrices = [
    {
      courseId: courses[0]._id,
      rows: cs301Outcomes.map((co, i) => ({ coId: co._id, coNumber: co.coNumber, ...correlations301[i] })),
      updatedBy: faculty._id
    },
    {
      courseId: courses[1]._id,
      rows: cs302Outcomes.map((co, i) => ({ coId: co._id, coNumber: co.coNumber, ...correlations302[i] })),
      updatedBy: faculty._id
    }
  ];
  
  const createdMatrices = await POMatrix.insertMany(matrices);
  console.log(`Created ${createdMatrices.length} CO-PO matrices`);
  
  return createdMatrices;
};

const seedMarks = async (courses, outcomes, students, faculty) => {
  console.log('Seeding marks...');
  
  const cs301Outcomes = outcomes.filter(o => o.courseId.toString() === courses[0]._id.toString());
  const performanceLevels = [0.75, 0.85, 0.60, 0.90, 0.50]; // Different student performance
  
  const generateMarks = (assessmentType, maxPerQ) => {
    return {
      courseId: courses[0]._id,
      uploadedBy: faculty._id,
      assessmentType,
      records: students.map((student, sIdx) => ({
        studentId: student._id,
        rollNumber: student.rollNumber,
        questionWiseMarks: cs301Outcomes.map((co, qIdx) => {
          const marks = Math.min(maxPerQ, Math.round(maxPerQ * performanceLevels[sIdx] + Math.random() * 2));
          return {
            questionNo: `Q${qIdx + 1}`,
            marksObtained: marks,
            maxMarks: maxPerQ,
            mappedCO: co._id
          };
        })
      })),
      totalMaxMarks: maxPerQ * cs301Outcomes.length,
      isProcessed: false
    };
  };
  
  const marksRecords = [
    generateMarks('internal1', 10),
    generateMarks('internal2', 20),
    generateMarks('assignment', 15),
    generateMarks('external', 10)
  ];
  
  const createdMarks = await Marks.insertMany(marksRecords);
  console.log(`Created ${createdMarks.length} marks records`);
  
  return createdMarks;
};

const seedFeedback = async (courses, outcomes, students) => {
  console.log('Seeding feedback...');
  
  const cs301Outcomes = outcomes.filter(o => o.courseId.toString() === courses[0]._id.toString());
  
  // Fixed rating patterns - all values between 1-5
  const studentRatings = [
    [4, 5, 4, 4, 5],  // Student 1
    [5, 4, 5, 4, 4],  // Student 2
    [3, 4, 3, 3, 4],  // Student 3
    [4, 5, 4, 5, 4],  // Student 4
    [3, 3, 4, 3, 3]   // Student 5
  ];
  
  const comments = [
    'Excellent course with practical examples',
    'Good teaching methodology',
    'Could include more hands-on sessions',
    'Very informative and well structured',
    'Helpful for placements'
  ];
  
  const feedbacks = students.map((student, idx) => ({
    courseId: courses[0]._id,
    studentId: student._id,
    responses: cs301Outcomes.map((co, coIdx) => ({
      coId: co._id,
      coNumber: co.coNumber,
      rating: studentRatings[idx][coIdx % 5]
    })),
    comments: comments[idx]
  }));
  
  const createdFeedbacks = await Feedback.insertMany(feedbacks);
  console.log(`Created ${createdFeedbacks.length} feedback records`);
  
  return createdFeedbacks;
};

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB!');
    
    await clearDatabase();
    
    const users = await seedUsers();
    const courses = await seedCourses(users.faculty, users.students);
    const outcomes = await seedCourseOutcomes(courses);
    const matrices = await seedPOMatrix(courses, outcomes, users.faculty);
    const marks = await seedMarks(courses, outcomes, users.students, users.faculty);
    const feedbacks = await seedFeedback(courses, outcomes, users.students);
    
    console.log('\n' + '='.repeat(50));
    console.log('DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@nbac.edu / admin123');
    console.log('Faculty: john.smith@nbac.edu / faculty123');
    console.log('Student: rahul.kumar@nbac.edu / student123');
    console.log('\n✅ Ready to test!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed.');
    process.exit(0);
  }
};

seedDatabase();