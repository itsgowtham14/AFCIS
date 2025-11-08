// Comprehensive script to fix all section-related issues
// This will normalize both student and faculty sections for consistent matching

const API_URL = 'http://localhost:5000/api';

async function makeRequest(url, method, data, token) {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || 'Request failed');
  }

  return json;
}

async function fixAllSections() {
  try {
    console.log('🔧 SECTION NORMALIZATION SCRIPT');
    console.log('================================\n');

    // First login as admin
    console.log('🔐 Logging in as admin...');
    const loginData = await makeRequest(
      `${API_URL}/auth/login`,
      'POST',
      {
        email: 'admin@stackhack.edu',
        password: 'admin@123'
      }
    );

    const token = loginData.token;
    console.log('✅ Login successful!\n');

    // Fix student sections
    console.log('👨‍🎓 Fixing student sections...');
    console.log('   Converting single letters (A, B, C, D) to full format (1A, 2B, etc.)');
    const studentFix = await makeRequest(
      `${API_URL}/users/fix-student-sections`,
      'POST',
      {},
      token
    );

    console.log('✅ Student sections fixed!');
    console.log(`   📊 Total students: ${studentFix.totalStudents}`);
    console.log(`   📝 Updated: ${studentFix.updated}`);
    console.log(`   💬 ${studentFix.message}\n`);

    // Fix faculty sections
    console.log('👨‍🏫 Fixing faculty sections...');
    console.log('   Splitting comma-separated sections and normalizing to uppercase');
    const facultyFix = await makeRequest(
      `${API_URL}/users/fix-faculty-sections`,
      'POST',
      {},
      token
    );

    console.log('✅ Faculty sections fixed!');
    console.log(`   📊 Total faculty: ${facultyFix.totalFaculty}`);
    console.log(`   📝 Updated: ${facultyFix.updated}`);
    console.log(`   💬 ${facultyFix.message}\n`);

    console.log('================================');
    console.log('🎉 ALL SECTIONS NORMALIZED!');
    console.log('================================\n');
    console.log('Next steps:');
    console.log('1. Verify that students can now see forms created by faculty');
    console.log('2. When creating new forms, use section format like: 1A, 2B, 3C, 4D');
    console.log('3. All sections are now stored in UPPERCASE for consistent matching\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAllSections();
