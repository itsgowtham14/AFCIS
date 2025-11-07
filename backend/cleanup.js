const mongoose = require('mongoose');
const User = require('./models/User');
const FeedbackForm = require('./models/FeedbackForm');

mongoose.connect('mongodb://localhost:27017/student-feedback');

async function cleanup() {
  try {
    console.log('\n=== DELETING TEST DATA ===\n');
    
    // Delete test users
    const deletedUsers = await User.deleteMany({
      email: { $in: ['faculty@test.com', 'student1@test.com', 'student2@test.com', 'student3@test.com'] }
    });
    console.log(`✓ Deleted ${deletedUsers.deletedCount} test users`);
    
    // Delete test forms
    const deletedForms = await FeedbackForm.deleteMany({
      title: 'Mid-Term Feedback'
    });
    console.log(`✓ Deleted ${deletedForms.deletedCount} test forms`);
    
    // Show what's left
    const remainingUsers = await User.countDocuments();
    const remainingForms = await FeedbackForm.countDocuments();
    
    console.log('\n=== REMAINING DATA ===');
    console.log(`Users: ${remainingUsers}`);
    console.log(`Forms: ${remainingForms}`);
    
    if (remainingUsers > 0) {
      const users = await User.find().select('email role personalInfo.firstName');
      console.log('\nExisting Users:');
      users.forEach(u => {
        console.log(`  - ${u.role}: ${u.personalInfo?.firstName} (${u.email})`);
      });
    }
    
    if (remainingForms > 0) {
      const forms = await FeedbackForm.find().select('title courseName targetSections');
      console.log('\nExisting Forms:');
      forms.forEach(f => {
        console.log(`  - ${f.title} (${f.courseName}) - Sections: ${f.targetSections}`);
      });
    }
    
    console.log('\n=== CLEANUP COMPLETE ===\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

cleanup();
