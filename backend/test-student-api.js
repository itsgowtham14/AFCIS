const fetch = require('node-fetch');

async function testStudentAPI() {
  try {
    console.log('Testing student login and active feedback API...');

    // Login as a student (using one of the students from debug output)
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: '231fa04087@vignan.ac.in', // Akhil's email
        password: 'password123' // Assuming default password
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response status:', loginResponse.status);
    console.log('Login data:', JSON.stringify(loginData, null, 2));

    if (!loginData.token) {
      console.log('Login failed, trying another student...');

      // Try another student
      const loginResponse2 = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: '231fa04094@vignan.ac.in', // Gowtham's email
          password: 'password123'
        })
      });

      const loginData2 = await loginResponse2.json();
      console.log('Login 2 response status:', loginResponse2.status);
      console.log('Login 2 data:', JSON.stringify(loginData2, null, 2));

      if (loginData2.token) {
        console.log('Using Gowtham\'s token...');
        await testActiveFeedback(loginData2.token);
      } else {
        console.log('Both logins failed. You may need to check the actual passwords in the database.');
      }
    } else {
      console.log('Using Akhil\'s token...');
      await testActiveFeedback(loginData.token);
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

async function testActiveFeedback(token) {
  try {
    console.log('\nTesting active feedback API...');

    const response = await fetch('http://localhost:5000/api/feedback/active', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Active feedback response status:', response.status);
    console.log('Active feedback data:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('Active feedback test error:', error);
  }
}

testStudentAPI();