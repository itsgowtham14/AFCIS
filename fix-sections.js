// Quick script to fix comma-separated sections in faculty data
// Run this once to migrate existing data

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

async function fixSections() {
  try {
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
    console.log('✅ Login successful!');

    // Call the fix endpoint
    console.log('\n🔧 Fixing faculty sections...');
    const fixData = await makeRequest(
      `${API_URL}/users/fix-faculty-sections`,
      'POST',
      {},
      token
    );

    console.log('✅ Fix completed!');
    console.log(`📊 Results:`, fixData);
    console.log(`   - Total faculty: ${fixData.totalFaculty}`);
    console.log(`   - Updated: ${fixData.updated}`);
    console.log(`   - Message: ${fixData.message}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixSections();
