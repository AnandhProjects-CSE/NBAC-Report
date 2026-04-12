/**
 * Run this script ONCE to fix the course unique index in MongoDB.
 * It drops the old index (without facultyId) and lets Mongoose
 * create the new one (with facultyId) automatically on next server start.
 *
 * Usage: node fix-course-index.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndex() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!');

  const db = mongoose.connection.db;
  const collection = db.collection('courses');

  // List all existing indexes
  const indexes = await collection.indexes();
  console.log('\nExisting indexes:');
  indexes.forEach(idx => console.log(' -', idx.name, JSON.stringify(idx.key)));

  // Drop the old index that blocks multiple faculty from same course
  const oldIndexName = 'courseCode_1_department_1_semester_1_academicYear_1';
  const oldIndexExists = indexes.some(idx => idx.name === oldIndexName);

  if (oldIndexExists) {
    console.log(`\nDropping old index: ${oldIndexName}`);
    await collection.dropIndex(oldIndexName);
    console.log('Old index dropped successfully!');
  } else {
    console.log('\nOld index not found (already dropped or never existed).');
  }

  console.log('\nDone! Now start your server with: node server.js');
  console.log('Mongoose will automatically create the new index on startup.\n');
  await mongoose.disconnect();
}

fixIndex().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
