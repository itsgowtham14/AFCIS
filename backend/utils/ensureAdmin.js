const User = require('../models/User');

/**
 * Ensure a system admin account exists and has the desired credentials.
 * If an admin exists, update its email/password to the configured values.
 * If none exists, create one.
 * NOTE: This will modify the admin account on every startup.
 */
const ensureAdmin = async (options = {}) => {
  const {
    universityId = 'ADMIN001',
    email = process.env.SYSTEM_ADMIN_EMAIL || 'admin@vignan.ac.in',
    password = process.env.SYSTEM_ADMIN_PASSWORD || 'admin@123'
  } = options;

  try {
    let admin = await User.findOne({ role: 'system_admin' });

    if (!admin) {
      console.log('No system admin found — creating default system admin');
      admin = await User.create({
        universityId,
        email,
        password,
        role: 'system_admin',
        personalInfo: {
          firstName: 'System',
          lastName: 'Administrator',
          phone: '0000000000'
        }
      });
      console.log('✅ Default system admin created:');
      console.log(`   email: ${email}`);
    } else {
      let changed = false;
      if (admin.email !== email) {
        admin.email = email;
        changed = true;
      }
      // Always update password if provided via env or options
      if (password) {
        admin.password = password;
        changed = true;
      }

      if (changed) {
        await admin.save();
        console.log('✅ System admin credentials updated');
        console.log(`   email: ${admin.email}`);
      } else {
        console.log('System admin already present with desired credentials');
      }
    }
  } catch (err) {
    console.error('Error ensuring system admin:', err.message || err);
  }
};

module.exports = ensureAdmin;
