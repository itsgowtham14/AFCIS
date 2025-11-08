const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/student-feedback');

async function checkUsers() {
  try {
    const allUsers = await User.find();
    console.log('\n=== ALL USERS ===');
    console.log(`Total users: ${allUsers.length}\n`);
    
    if (allUsers.length > 0) {
      allUsers.forEach(u => {
        console.log(`${u.role}: ${u.email} - ${u.personalInfo?.firstName} ${u.personalInfo?.lastName}`);
      });
    } else {
      console.log('NO USERS IN DATABASE!');
      console.log('\nYou need to:');
      console.log('1. Create users via Bulk User Creation');
      console.log('2. Or register manually');
    }
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== COLLECTIONS ===');
    collections.forEach(c => console.log(`  - ${c.name}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkUsers();
