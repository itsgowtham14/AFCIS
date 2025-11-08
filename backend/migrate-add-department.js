const mongoose = require('mongoose');
const FeedbackForm = require('./models/FeedbackForm');
const FeedbackResponse = require('./models/FeedbackResponse');
const User = require('./models/User');
require('dotenv').config();

/**
 * Migration script to add department field to existing FeedbackForm and FeedbackResponse documents
 * This fixes the issue where forms from different departments with same section were being mixed
 */
async function migrateDepartmentFields() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stack_hack_db');
    console.log('✅ Connected to MongoDB\n');

    let formsUpdated = 0;
    let formsSkipped = 0;
    let formsFailed = 0;
    let responsesUpdated = 0;
    let responsesSkipped = 0;
    let responsesFailed = 0;

    // ===== PART 1: Update FeedbackForms with department =====
    console.log('📋 PART 1: Updating FeedbackForm documents\n');
    
    const formsWithoutDept = await FeedbackForm.find({ 
      department: { $exists: false } 
    }).populate('facultyId', 'academicInfo.facultyDepartment');

    console.log(`Found ${formsWithoutDept.length} forms without department information\n`);

    for (const form of formsWithoutDept) {
      try {
        let department = null;
        
        if (form.facultyId && form.facultyId.academicInfo && form.facultyId.academicInfo.facultyDepartment) {
          department = String(form.facultyId.academicInfo.facultyDepartment).trim().toUpperCase();
        } else {
          // Try to fetch faculty separately if not populated
          const faculty = await User.findById(form.facultyId).select('academicInfo.facultyDepartment');
          if (faculty && faculty.academicInfo && faculty.academicInfo.facultyDepartment) {
            department = String(faculty.academicInfo.facultyDepartment).trim().toUpperCase();
          }
        }

        if (department) {
          await FeedbackForm.findByIdAndUpdate(form._id, { department });
          formsUpdated++;
          process.stdout.write(`\r✅ Forms: ${formsUpdated} | ⏭️ Skipped: ${formsSkipped} | ❌ Failed: ${formsFailed}`);
        } else {
          formsSkipped++;
          process.stdout.write(`\r✅ Forms: ${formsUpdated} | ⏭️ Skipped: ${formsSkipped} | ❌ Failed: ${formsFailed}`);
          console.log(`\n⚠️ Warning: No department info for form ${form._id} (faculty: ${form.facultyId})`);
        }
      } catch (error) {
        formsFailed++;
        process.stdout.write(`\r✅ Forms: ${formsUpdated} | ⏭️ Skipped: ${formsSkipped} | ❌ Failed: ${formsFailed}`);
        console.log(`\n❌ Error updating form ${form._id}:`, error.message);
      }
    }

    console.log('\n\n📊 Forms Migration Summary:');
    console.log(`   ✅ Successfully updated: ${formsUpdated}`);
    console.log(`   ⏭️ Skipped (no department info): ${formsSkipped}`);
    console.log(`   ❌ Failed: ${formsFailed}`);
    console.log(`   📊 Total processed: ${formsWithoutDept.length}\n`);

    // ===== PART 2: Update FeedbackResponses with department =====
    console.log('📝 PART 2: Updating FeedbackResponse documents\n');
    
    const responsesWithoutDept = await FeedbackResponse.find({ 
      studentDepartment: { $exists: false } 
    }).populate('studentId', 'academicInfo.department');

    console.log(`Found ${responsesWithoutDept.length} responses without department information\n`);

    for (const response of responsesWithoutDept) {
      try {
        let studentDepartment = null;
        
        if (response.studentId && response.studentId.academicInfo && response.studentId.academicInfo.department) {
          studentDepartment = String(response.studentId.academicInfo.department).trim().toUpperCase();
        } else {
          // Try to fetch student separately if not populated
          const student = await User.findById(response.studentId).select('academicInfo.department');
          if (student && student.academicInfo && student.academicInfo.department) {
            studentDepartment = String(student.academicInfo.department).trim().toUpperCase();
          }
        }

        if (studentDepartment) {
          await FeedbackResponse.findByIdAndUpdate(response._id, { studentDepartment });
          responsesUpdated++;
          process.stdout.write(`\r✅ Responses: ${responsesUpdated} | ⏭️ Skipped: ${responsesSkipped} | ❌ Failed: ${responsesFailed}`);
        } else {
          responsesSkipped++;
          process.stdout.write(`\r✅ Responses: ${responsesUpdated} | ⏭️ Skipped: ${responsesSkipped} | ❌ Failed: ${responsesFailed}`);
          console.log(`\n⚠️ Warning: No department info for response ${response._id} (student: ${response.studentId})`);
        }
      } catch (error) {
        responsesFailed++;
        process.stdout.write(`\r✅ Responses: ${responsesUpdated} | ⏭️ Skipped: ${responsesSkipped} | ❌ Failed: ${responsesFailed}`);
        console.log(`\n❌ Error updating response ${response._id}:`, error.message);
      }
    }

    console.log('\n\n📊 Responses Migration Summary:');
    console.log(`   ✅ Successfully updated: ${responsesUpdated}`);
    console.log(`   ⏭️ Skipped (no department info): ${responsesSkipped}`);
    console.log(`   ❌ Failed: ${responsesFailed}`);
    console.log(`   📊 Total processed: ${responsesWithoutDept.length}\n`);

    // ===== FINAL SUMMARY =====
    console.log('═══════════════════════════════════════');
    console.log('📋 FINAL MIGRATION SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`FeedbackForms:`);
    console.log(`   ✅ Updated: ${formsUpdated}`);
    console.log(`   ⏭️ Skipped: ${formsSkipped}`);
    console.log(`   ❌ Failed: ${formsFailed}`);
    console.log(`\nFeedbackResponses:`);
    console.log(`   ✅ Updated: ${responsesUpdated}`);
    console.log(`   ⏭️ Skipped: ${responsesSkipped}`);
    console.log(`   ❌ Failed: ${responsesFailed}`);
    console.log('═══════════════════════════════════════\n');

    if (formsUpdated > 0 || responsesUpdated > 0) {
      console.log('✨ Migration completed successfully!');
    } else if (formsSkipped > 0 || responsesSkipped > 0) {
      console.log('⚠️ Some documents could not be updated due to missing department information.');
      console.log('   Please ensure all users have department information in their profiles.');
    }

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
console.log('🚀 Starting migration: Add department to FeedbackForm and FeedbackResponse documents\n');
console.log('This will fix the issue where forms from different departments');
console.log('with the same section (e.g., CSE 2B vs ECE 2B) were being mixed up.\n');
migrateDepartmentFields();
