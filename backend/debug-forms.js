const mongoose = require('mongoose');
const FeedbackForm = require('./models/FeedbackForm');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/stack_hack_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debug() {
  try {
    console.log('\n=== DEBUGGING FORMS ===\n');
    
    // 1. Check all forms
    const forms = await FeedbackForm.find();
    console.log(`Total forms in database: ${forms.length}\n`);
    
    forms.forEach((form, idx) => {
      console.log(`Form ${idx + 1}:`);
      console.log(`  Title: ${form.title}`);
      console.log(`  Course: ${form.courseName} (${form.courseCode})`);
      console.log(`  Status: ${form.status}`);
      console.log(`  Target Sections:`, form.targetSections);
      console.log(`  Target Sections Type:`, typeof form.targetSections);
      console.log(`  Is Array:`, Array.isArray(form.targetSections));
      if (form.schedule) {
        console.log(`  Open Date: ${form.schedule.openDate}`);
        console.log(`  Close Date: ${form.schedule.closeDate}`);
      }
      console.log('');
    });
    
    // 2. Check students
    const students = await User.find({ role: 'student' });
    console.log(`\nTotal students: ${students.length}\n`);
    
    students.forEach((student, idx) => {
      console.log(`Student ${idx + 1}:`);
      console.log(`  Name: ${student.personalInfo?.firstName} ${student.personalInfo?.lastName}`);
      console.log(`  Email: ${student.email}`);
      console.log(`  Section:`, student.academicInfo?.section);
      console.log(`  Section Type:`, typeof student.academicInfo?.section);
      console.log('');
    });
    
    // 3. Test matching logic (using the same logic as controller)
    console.log('\n=== MATCHING TEST (Controller Logic) ===\n');
    const currentDate = new Date();
    console.log('Current Date:', currentDate);
    console.log('');
    
    for (const student of students) {
      const studentSection = student.academicInfo?.section;
      console.log(`Student: ${student.personalInfo?.firstName} (Section: ${studentSection})`);
      
      if (!studentSection) {
        console.log('  No section - skipping');
        continue;
      }
      
      // Normalize the student's section value (trim, uppercase)
      let normalizedStudentSection = String(studentSection).trim().toUpperCase();
      console.log(`  Normalized student section: "${normalizedStudentSection}"`);

      // Build section variants to tolerate minor format differences
      const sectionVariants = new Set();
      sectionVariants.add(normalizedStudentSection);

      // If section is like 'A' allow '1A', '01A', etc. If it starts with digit, also allow stripped version
      if (!/^[0-9]/.test(normalizedStudentSection)) {
        sectionVariants.add('1' + normalizedStudentSection);
        sectionVariants.add('01' + normalizedStudentSection);
      } else {
        // starts with digits like '1A' -> add stripped 'A'
        const stripped = normalizedStudentSection.replace(/^0+/, '').replace(/^[0-9]+/, '');
        if (stripped) sectionVariants.add(stripped);
      }

      // Also add upper-case and lower-case variants for safe matching
      Array.from(sectionVariants).forEach(v => {
        const s = String(v);
        sectionVariants.add(s.toUpperCase());
        sectionVariants.add(s.toLowerCase());
      });

      console.log(`  Section variants: [${Array.from(sectionVariants).join(', ')}]`);
      
      // Query using variants (same as controller)
      const matchingForms = await FeedbackForm.find({
        status: 'active',
        targetSections: { $in: Array.from(sectionVariants) },
        'schedule.openDate': { $lte: currentDate },
        $or: [
          { 'schedule.closeDate': { $exists: false } },
          { 'schedule.closeDate': null },
          { 'schedule.closeDate': { $gte: currentDate } }
        ]
      });
      
      console.log(`  Matching forms: ${matchingForms.length}`);
      if (matchingForms.length > 0) {
        matchingForms.forEach(f => {
          console.log(`    - ${f.title} (${f.courseName}) - targets: ${JSON.stringify(f.targetSections)}`);
        });
      }
      
      // If no direct matches, test fallback normalization
      if (matchingForms.length === 0) {
        console.log('  Testing fallback normalization...');
        
        const broadForms = await FeedbackForm.find({
          status: 'active',
          'schedule.openDate': { $lte: currentDate },
          $or: [
            { 'schedule.closeDate': { $exists: false } },
            { 'schedule.closeDate': null },
            { 'schedule.closeDate': { $gte: currentDate } }
          ]
        });
        
        // Normalization helper (strip prefixes, spaces, hyphens, leading zeros)
        const normalize = (s) => {
          if (!s) return '';
          return String(s)
            .toUpperCase()
            .trim()
            .replace(/^SECTION[\s:-]*/,'')
            .replace(/^SEC[\s:-]*/,'')
            .replace(/^S[\s:-]*/,'')
            .replace(/\s+/g,'')
            .replace(/-/g,'')
            .replace(/^0+/,'');
        };
        
        const normalizedStudent = normalize(studentSection);
        console.log(`  Normalized student for fallback: "${normalizedStudent}"`);
        
        const fallbackMatches = broadForms.filter(f => {
          const anyMatch = (f.targetSections || []).some(ts => {
            const normTs = normalize(ts);
            console.log(`    Comparing "${normTs}" with "${normalizedStudent}"`);
            if (normTs === normalizedStudent) return true;
            // Handle patterns like '1A' vs 'A' (strip leading digits)
            const strippedDigits = normTs.replace(/^[0-9]+/, '');
            console.log(`    Stripped comparison: "${strippedDigits}" vs "${normalizedStudent}"`);
            return strippedDigits === normalizedStudent;
          });
          return anyMatch;
        });
        
        console.log(`  Fallback matches: ${fallbackMatches.length}`);
        if (fallbackMatches.length > 0) {
          fallbackMatches.forEach(f => {
            console.log(`    - ${f.title} (${f.courseName}) - targets: ${JSON.stringify(f.targetSections)}`);
          });
        }
      }
      
      console.log('');
    }
    
    // 4. Check if dates are valid
    console.log('\n=== DATE VALIDATION ===\n');
    forms.forEach(form => {
      const openDate = new Date(form.schedule.openDate);
      const closeDate = new Date(form.schedule.closeDate);
      const isOpen = openDate <= currentDate;
      const isNotClosed = closeDate >= currentDate;
      
      console.log(`${form.title}:`);
      console.log(`  Open: ${openDate} (${isOpen ? 'PAST' : 'FUTURE'})`);
      console.log(`  Close: ${closeDate} (${isNotClosed ? 'NOT YET' : 'ALREADY CLOSED'})`);
      console.log(`  Active: ${form.status === 'active' && isOpen && isNotClosed ? 'YES ✓' : 'NO ✗'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

debug();
