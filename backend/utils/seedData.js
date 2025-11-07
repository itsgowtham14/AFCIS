const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');

// Load models
const User = require('../models/User');
const Course = require('../models/Course');
const CourseOffering = require('../models/CourseOffering');
const FacultyAssignment = require('../models/FacultyAssignment');
const FeedbackForm = require('../models/FeedbackForm');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany();
    await Course.deleteMany();
    await CourseOffering.deleteMany();
    await FacultyAssignment.deleteMany();
    await FeedbackForm.deleteMany();

    // Create ONLY System Admin
    console.log('Creating system admin...');
    const admin = await User.create({
      universityId: 'ADMIN001',
      email: 'admin@stackhack.edu',
      password: 'admin@123',
      role: 'system_admin',
      personalInfo: {
        firstName: 'System',
        lastName: 'Administrator',
        phone: '0000000000'
      }
    });

    console.log('✅ Database initialized successfully!');
    console.log('\n📋 Admin Login Credentials:');
    console.log('====================================');
    console.log('Email: admin@stackhack.edu');
    console.log('Password: admin@123');
    console.log('====================================');
    console.log('\n💡 Next Steps:');
    console.log('1. Login as admin');
    console.log('2. Go to "Bulk User Creation" in admin portal');
    console.log('3. Download the Excel template');
    console.log('4. Fill in user details (students, faculty, dept admins)');
    console.log('5. Upload the Excel file to create users');
    console.log('\n🎓 Use Department Admin to:');
    console.log('   - Add courses');
    console.log('   - Allocate courses to faculty');
    console.log('   - Assign sections to faculty');
    console.log('\n📝 Use Faculty to:');
    console.log('   - Create feedback forms for sections');
    console.log('   - View responses and analytics');
    console.log('   - Address student issues\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
