const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { universityId, email, password, role, personalInfo, academicInfo } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { universityId }] });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      universityId,
      email,
      password,
      role,
      personalInfo,
      academicInfo
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        universityId: user.universityId,
        email: user.email,
        role: user.role,
        personalInfo: user.personalInfo,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Update last login
      user.lastLogin = Date.now();
      await user.save();

      res.json({
        _id: user._id,
        universityId: user.universityId,
        email: user.email,
        role: user.role,
        personalInfo: user.personalInfo,
        academicInfo: user.academicInfo,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.personalInfo = req.body.personalInfo || user.personalInfo;
      user.academicInfo = req.body.academicInfo || user.academicInfo;
      user.preferences = req.body.preferences || user.preferences;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        universityId: updatedUser.universityId,
        email: updatedUser.email,
        role: updatedUser.role,
        personalInfo: updatedUser.personalInfo,
        academicInfo: updatedUser.academicInfo,
        preferences: updatedUser.preferences
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    // Prevent system/admin accounts from using this endpoint
    if (user.role === 'system_admin') {
      return res.status(403).json({ message: 'Password change via this endpoint is not allowed for system administrators' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Basic validation for new password length (schema enforces minlength:6)
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Update password
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
