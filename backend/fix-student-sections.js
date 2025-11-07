const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/stack_hack_db');

async function fixSections() {
  try {
    console.log('\n=== FIXING STUDENT SECTIONS ===\n');
    
    // Update students with section 'A' to '1A'
    const result1 = await User.updateMany(
      { role: 'student', 'academicInfo.section': 'A' },
      { $set: { 'academicInfo.section': '1A' } }
    );
    console.log(`✓ Updated ${result1.modifiedCount} students from 'A' to '1A'`);
    
    // Update students with section 'B' to '1B'
    const result2 = await User.updateMany(
      { role: 'student', 'academicInfo.section': 'B' },
      { $set: { 'academicInfo.section': '1B' } }
    );
    console.log(`✓ Updated ${result2.modifiedCount} students from 'B' to '1B'`);
    
    // Show updated students
    const students = await User.find({ role: 'student' }).select('personalInfo.firstName academicInfo.section');
    console.log('\n=== UPDATED STUDENTS ===');
    students.forEach(s => {
      console.log(`  ${s.personalInfo.firstName}: Section ${s.academicInfo.section}`);
    });
    
    console.log('\n=== FIX COMPLETE ===\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixSections();
