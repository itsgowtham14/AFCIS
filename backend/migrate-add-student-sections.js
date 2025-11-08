const mongoose = require('mongoose');
const FeedbackResponse = require('./models/FeedbackResponse');
const User = require('./models/User');
require('dotenv').config();

/**
 * Migration script to add studentSection field to existing FeedbackResponse documents
 * This fixes the issue where responses from different sections were being mixed up
 */
async function migrateStudentSections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stack_hack_db');
    console.log('✅ Connected to MongoDB');

    // Find all responses that don't have studentSection field
    const responsesWithoutSection = await FeedbackResponse.find({ 
      studentSection: { $exists: false } 
    }).populate('studentId', 'academicInfo.section');

    console.log(`\n📊 Found ${responsesWithoutSection.length} responses without section information`);

    let updated = 0;
    let failed = 0;
    let skipped = 0;

    for (const response of responsesWithoutSection) {
      try {
        // Get student's section from their profile
        let studentSection = null;
        
        if (response.studentId && response.studentId.academicInfo && response.studentId.academicInfo.section) {
          studentSection = String(response.studentId.academicInfo.section).trim().toUpperCase();
        } else {
          // Try to fetch student separately if not populated
          const student = await User.findById(response.studentId).select('academicInfo.section');
          if (student && student.academicInfo && student.academicInfo.section) {
            studentSection = String(student.academicInfo.section).trim().toUpperCase();
          }
        }

        if (studentSection) {
          // Update the response with studentSection
          await FeedbackResponse.findByIdAndUpdate(response._id, {
            studentSection: studentSection
          });
          updated++;
          process.stdout.write(`\r✅ Updated: ${updated} | ⏭️ Skipped: ${skipped} | ❌ Failed: ${failed}`);
        } else {
          // No section info available - skip this response
          skipped++;
          process.stdout.write(`\r✅ Updated: ${updated} | ⏭️ Skipped: ${skipped} | ❌ Failed: ${failed}`);
          console.log(`\n⚠️ Warning: No section info for response ${response._id} (student: ${response.studentId})`);
        }
      } catch (error) {
        failed++;
        process.stdout.write(`\r✅ Updated: ${updated} | ⏭️ Skipped: ${skipped} | ❌ Failed: ${failed}`);
        console.log(`\n❌ Error updating response ${response._id}:`, error.message);
      }
    }

    console.log('\n\n📋 Migration Summary:');
    console.log(`   ✅ Successfully updated: ${updated}`);
    console.log(`   ⏭️ Skipped (no section info): ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📊 Total processed: ${responsesWithoutSection.length}`);

    if (updated > 0) {
      console.log('\n✨ Migration completed successfully!');
    } else if (skipped > 0) {
      console.log('\n⚠️ Some responses could not be updated due to missing section information.');
      console.log('   Please ensure all students have section information in their profiles.');
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
console.log('🚀 Starting migration: Add studentSection to FeedbackResponse documents\n');
migrateStudentSections();
