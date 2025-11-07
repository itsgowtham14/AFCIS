const mongoose = require('mongoose');
const User = require('./models/User');
const FeedbackForm = require('./models/FeedbackForm');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/student-feedback');

async function quickSetup() {
  try {
    console.log('\n=== QUICK SETUP - DEMO DATA ===\n');
    
    // Create a faculty user
    const facultyPassword = await bcrypt.hash('faculty123', 10);
    const faculty = await User.create({
      email: 'faculty@test.com',
      password: facultyPassword,
      role: 'faculty',
      universityId: 'FAC001',
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '1234567890'
      },
      academicInfo: {
        department: 'Computer Science',
        courses: [
          {
            courseName: 'Data Structures',
            courseCode: 'CS201',
            sections: ['1A', '1B', '2A']
          },
          {
            courseName: 'Database Systems',
            courseCode: 'CS301',
            sections: ['1A', '2B']
          }
        ]
      }
    });
    console.log('✓ Created faculty:', faculty.email);
    
    // Create students
    const studentPassword = await bcrypt.hash('student123', 10);
    
    const student1 = await User.create({
      email: 'student1@test.com',
      password: studentPassword,
      role: 'student',
      universityId: 'CS21001',
      personalInfo: {
        firstName: 'Alice',
        lastName: 'Smith',
        phoneNumber: '9876543210'
      },
      academicInfo: {
        department: 'Computer Science',
        section: '1A',
        semester: 3,
        rollNumber: 'CS21001'
      }
    });
    console.log('✓ Created student 1:', student1.email, '- Section 1A');
    
    const student2 = await User.create({
      email: 'student2@test.com',
      password: studentPassword,
      role: 'student',
      universityId: 'CS21002',
      personalInfo: {
        firstName: 'Bob',
        lastName: 'Johnson',
        phoneNumber: '9876543211'
      },
      academicInfo: {
        department: 'Computer Science',
        section: '1B',
        semester: 3,
        rollNumber: 'CS21002'
      }
    });
    console.log('✓ Created student 2:', student2.email, '- Section 1B');
    
    const student3 = await User.create({
      email: 'student3@test.com',
      password: studentPassword,
      role: 'student',
      universityId: 'CS21003',
      personalInfo: {
        firstName: 'Charlie',
        lastName: 'Brown',
        phoneNumber: '9876543212'
      },
      academicInfo: {
        department: 'Computer Science',
        section: '2A',
        semester: 3,
        rollNumber: 'CS21003'
      }
    });
    console.log('✓ Created student 3:', student3.email, '- Section 2A');
    
    // Create a sample feedback form
    const form = await FeedbackForm.create({
      title: 'Mid-Term Feedback',
      courseName: 'Data Structures',
      courseCode: 'CS201',
      description: 'Please provide your feedback on the course so far',
      type: 'module',
      createdBy: faculty._id,
      targetSections: ['1A', '1B'],
      status: 'active',
      questions: [
        {
          questionText: 'How would you rate the course content?',
          type: 'rating',
          isRequired: true
        },
        {
          questionText: 'How would you rate the teaching methodology?',
          type: 'rating',
          isRequired: true
        },
        {
          questionText: 'What improvements would you suggest?',
          type: 'text',
          isRequired: false
        }
      ],
      schedule: {
        openDate: new Date(Date.now() - 24*60*60*1000), // Yesterday
        closeDate: new Date(Date.now() + 7*24*60*60*1000), // Next week
        reminderFrequency: 'daily'
      }
    });
    console.log('✓ Created feedback form:', form.title);
    
    console.log('\n=== SETUP COMPLETE ===\n');
    console.log('Login Credentials:');
    console.log('\nFaculty:');
    console.log('  Email: faculty@test.com');
    console.log('  Password: faculty123');
    console.log('\nStudents:');
    console.log('  Email: student1@test.com (Section 1A)');
    console.log('  Email: student2@test.com (Section 1B)');
    console.log('  Email: student3@test.com (Section 2A)');
    console.log('  Password: student123');
    console.log('\nFeedback Form:');
    console.log('  Title:', form.title);
    console.log('  Course:', form.courseName);
    console.log('  Sections:', form.targetSections.join(', '));
    console.log('  Status:', form.status);
    console.log('\nStudents in sections 1A and 1B should see the form!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

quickSetup();
