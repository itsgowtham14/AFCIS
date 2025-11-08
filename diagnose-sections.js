// Diagnostic script to check section matching
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./backend/models/User');
const FeedbackForm = require('./backend/models/FeedbackForm');

async function diagnose() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all students
    const students = await User.find({ role: 'student' }).select('universityId personalInfo academicInfo');
    console.log('👨‍🎓 STUDENTS:');
    console.log('='.repeat(80));
    students.forEach(s => {
      console.log(`ID: ${s.universityId} | Name: ${s.personalInfo.firstName} ${s.personalInfo.lastName}`);
      console.log(`   Section: "${s.academicInfo?.section}" | Dept: ${s.academicInfo?.department} | Sem: ${s.academicInfo?.semester}`);
    });

    console.log('\n👨‍🏫 FACULTY:');
    console.log('='.repeat(80));
    const faculty = await User.find({ role: 'faculty' }).select('universityId personalInfo academicInfo');
    faculty.forEach(f => {
      console.log(`ID: ${f.universityId} | Name: ${f.personalInfo.firstName} ${f.personalInfo.lastName}`);
      if (f.academicInfo?.courses) {
        f.academicInfo.courses.forEach(c => {
          console.log(`   Course: ${c.courseName} | Sections: [${c.sections.join(', ')}]`);
        });
      }
    });

    console.log('\n📋 FEEDBACK FORMS:');
    console.log('='.repeat(80));
    const forms = await FeedbackForm.find().populate('facultyId', 'personalInfo').select('title courseName targetSections status schedule facultyId');
    
    if (forms.length === 0) {
      console.log('❌ NO FORMS FOUND! This is the problem - faculty needs to create forms first.');
    } else {
      forms.forEach(f => {
        console.log(`\nForm: "${f.title}"`);
        console.log(`   Course: ${f.courseName}`);
        console.log(`   Status: ${f.status}`);
        console.log(`   Target Sections: [${f.targetSections.join(', ')}]`);
        console.log(`   Faculty: ${f.facultyId?.personalInfo?.firstName} ${f.facultyId?.personalInfo?.lastName}`);
        console.log(`   Open: ${f.schedule?.openDate}`);
        console.log(`   Close: ${f.schedule?.closeDate || 'No close date'}`);
      });
    }

    // Test matching logic
    console.log('\n🔍 MATCHING TEST:');
    console.log('='.repeat(80));
    
    const activeForms = forms.filter(f => f.status === 'active');
    console.log(`Active forms: ${activeForms.length}`);
    
    if (students.length > 0 && activeForms.length > 0) {
      const testStudent = students[0];
      const studentSection = testStudent.academicInfo?.section;
      
      console.log(`\nTesting student: ${testStudent.personalInfo.firstName} (Section: "${studentSection}")`);
      
      activeForms.forEach(form => {
        const matches = form.targetSections.includes(studentSection);
        const matchSymbol = matches ? '✅' : '❌';
        console.log(`${matchSymbol} Form "${form.title}" targets [${form.targetSections.join(', ')}] - Match: ${matches}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnose();
