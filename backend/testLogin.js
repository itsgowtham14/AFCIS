const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

const testLogin = async () => {
  try {
    await connectDB();

    const testCredentials = [
      { email: 'admin@university.edu', password: 'admin123' },
      { email: 'dept.cs@university.edu', password: 'dept123' },
      { email: 'john.smith@university.edu', password: 'faculty123' },
      { email: 'alice.johnson@student.edu', password: 'student123' }
    ];

    console.log('Testing login credentials...\n');

    for (const cred of testCredentials) {
      const user = await User.findOne({ email: cred.email });
      
      if (!user) {
        console.log(`❌ ${cred.email} - User not found`);
        continue;
      }

      const isMatch = await user.matchPassword(cred.password);
      
      if (isMatch) {
        console.log(`✅ ${cred.email} - Password matches! (Role: ${user.role})`);
      } else {
        console.log(`❌ ${cred.email} - Password does NOT match`);
        console.log(`   Stored hash: ${user.password.substring(0, 30)}...`);
      }
    }

    console.log('\n✅ Login test completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error testing login:', error);
    process.exit(1);
  }
};

testLogin();
