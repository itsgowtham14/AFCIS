// Simple test to verify section matching logic
// This mimics what the backend does

// Sample student section (what we expect after migration)
const studentSection = "2B"; // This is what should be in the student's academicInfo.section

// Sample form targetSections (from your database)
const formTargetSections = ["2B", "2C"];

console.log('🔍 SECTION MATCHING TEST');
console.log('='.repeat(60));
console.log(`Student Section: "${studentSection}"`);
console.log(`Form Target Sections: [${formTargetSections.map(s => `"${s}"`).join(', ')}]`);
console.log('='.repeat(60));

// Normalize student section (what backend does)
const normalizedStudentSection = String(studentSection).trim().toUpperCase();
console.log(`\nNormalized Student Section: "${normalizedStudentSection}"`);

// Build section variants (what backend does)
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
Array.from(Array.from(sectionVariants)).forEach(v => {
  const s = String(v);
  sectionVariants.add(s.toUpperCase());
  sectionVariants.add(s.toLowerCase());
});

console.log(`\nSection Variants Generated: [${Array.from(sectionVariants).map(s => `"${s}"`).join(', ')}]`);

// Check if any variant matches the form's target sections
const matches = formTargetSections.some(target => 
  Array.from(sectionVariants).includes(target)
);

console.log('\n' + '='.repeat(60));
console.log(`MATCH RESULT: ${matches ? '✅ MATCH FOUND' : '❌ NO MATCH'}`);
console.log('='.repeat(60));

if (matches) {
  console.log('\n✅ The form SHOULD be visible to the student');
} else {
  console.log('\n❌ The form WILL NOT be visible to the student');
  console.log('\nPossible issues:');
  console.log('1. Student section in DB is not "2B" (check actual value)');
  console.log('2. Form targetSections in DB is not ["2B", "2C"] (check actual value)');
  console.log('3. Case sensitivity issue (should be handled by normalization)');
}

// Additional test cases
console.log('\n\n📋 ADDITIONAL TEST CASES:');
console.log('='.repeat(60));

const testCases = [
  { student: "2B", form: ["2B", "2C"], expected: true },
  { student: "2b", form: ["2B", "2C"], expected: true },
  { student: "B", form: ["2B", "2C"], expected: true },  // After migration, this should be "2B"
  { student: "2A", form: ["2B", "2C"], expected: false },
  { student: "1B", form: ["2B", "2C"], expected: false },
];

testCases.forEach((test, idx) => {
  const normalized = String(test.student).trim().toUpperCase();
  const variants = new Set([normalized]);
  
  if (!/^[0-9]/.test(normalized)) {
    variants.add('1' + normalized);
    variants.add('2' + normalized);
  } else {
    const stripped = normalized.replace(/^0+/, '').replace(/^[0-9]+/, '');
    if (stripped) variants.add(stripped);
  }
  
  const result = test.form.some(t => Array.from(variants).includes(t));
  const symbol = result === test.expected ? '✅' : '❌';
  
  console.log(`${symbol} Test ${idx + 1}: Student="${test.student}" vs Form=[${test.form.join(',')}] => ${result ? 'MATCH' : 'NO MATCH'} (expected: ${test.expected ? 'MATCH' : 'NO MATCH'})`);
});
