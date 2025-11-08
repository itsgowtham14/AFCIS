const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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
        password: 'student123' // Correct password from quick-setup.js
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response status:', loginResponse.status);
    console.log('Login successful:', !!loginData.token);

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
          password: 'student123'
        })
      });

      const loginData2 = await loginResponse2.json();
      console.log('Login 2 response status:', loginResponse2.status);
      console.log('Login 2 successful:', !!loginData2.token);

      if (loginData2.token) {
        console.log('Using Gowtham\'s token...');
        await testActiveFeedback(loginData2.token, loginData2);
      } else {
        console.log('Both logins failed. You may need to check the actual passwords in the database.');
      }
    } else {
      console.log('Using Akhil\'s token...');
      await testActiveFeedback(loginData.token, loginData);
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

async function testActiveFeedback(token, userData) {
  try {
    console.log('\n=== TESTING ACTIVE FEEDBACK API ===');
    console.log('User:', userData.personalInfo?.firstName, userData.personalInfo?.lastName);
    console.log('Section:', userData.academicInfo?.section);

    const response = await fetch('http://localhost:5000/api/feedback/active', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Active feedback response status:', response.status);
    console.log('Number of forms returned:', Array.isArray(data) ? data.length : 'Not an array');
    console.log('Forms data:', JSON.stringify(data, null, 2));

    if (Array.isArray(data) && data.length > 0) {
      console.log('\n=== FORM DETAILS ===');
      data.forEach((form, index) => {
        console.log(`${index + 1}. ${form.title}`);
        console.log(`   Course: ${form.courseName}`);
        console.log(`   Submitted: ${form.submitted}`);
        console.log(`   Target Sections: ${JSON.stringify(form.targetSections)}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Active feedback test error:', error);
  }
}

testStudentAPI();