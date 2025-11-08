const Announcement = require('../models/Announcement');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create announcement/action item
// @route   POST /api/announcements
// @access  Private/Faculty/Department Admin
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, type, targetSections, courseName, courseCode, relatedFeedbackForm, priority } = req.body;

    // Get department based on user role
    let department;
    if (req.user.role === 'faculty') {
      department = req.user.academicInfo?.facultyDepartment;
    } else if (req.user.role === 'department_admin') {
      department = req.user.academicInfo?.managedDepartment;
    }

    if (!department) {
      return res.status(400).json({ 
        message: 'Department information is missing. Please contact admin.' 
      });
    }

    // Normalize department and sections
    const normalizedDepartment = String(department).trim().toUpperCase();
    const normalizedSections = Array.isArray(targetSections) 
      ? targetSections.map(s => String(s).trim().toUpperCase())
      : [];

    const announcement = await Announcement.create({
      title,
      message,
      type: type || 'improvement_action',
      createdBy: {
        userId: req.user._id,
        role: req.user.role,
        name: `${req.user.personalInfo.firstName} ${req.user.personalInfo.lastName}`
      },
      department: normalizedDepartment,
      targetSections: normalizedSections,
      courseName,
      courseCode,
      relatedFeedbackForm,
      priority: priority || 'medium',
      status: 'active'
    });

    // Create notifications for target students
    if (normalizedSections.length > 0) {
      const students = await User.find({
        role: 'student',
        'academicInfo.department': { $regex: new RegExp(`^${normalizedDepartment}$`, 'i') },
        'academicInfo.section': { $in: normalizedSections },
        isActive: true
      });

      const notifications = students.map(student => ({
        userId: student._id,
        title: 'New Announcement',
        message: title,
        type: 'announcement',
        relatedEntity: {
          type: 'announcement',
          id: announcement._id
        }
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    res.status(201).json(announcement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get announcements for user
// @route   GET /api/announcements
// @access  Private
exports.getAnnouncements = async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    let query = { status };

    // Filter based on user role
    if (req.user.role === 'student') {
      const studentSection = req.user.academicInfo?.section;
      const studentDepartment = req.user.academicInfo?.department;

      if (!studentSection || !studentDepartment) {
        return res.json([]);
      }

      const normalizedSection = String(studentSection).trim().toUpperCase();
      const normalizedDepartment = String(studentDepartment).trim().toUpperCase();

      query = {
        ...query,
        department: { $regex: new RegExp(`^${normalizedDepartment}$`, 'i') },
        $or: [
          { targetSections: normalizedSection },
          { targetSections: { $size: 0 } } // Department-wide announcements
        ],
        'visibility.students': true
      };
    } else if (req.user.role === 'faculty') {
      const facultyDepartment = req.user.academicInfo?.facultyDepartment;
      
      if (!facultyDepartment) {
        return res.json([]);
      }

      const normalizedDepartment = String(facultyDepartment).trim().toUpperCase();

      query = {
        ...query,
        department: { $regex: new RegExp(`^${normalizedDepartment}$`, 'i') },
        $or: [
          { 'createdBy.userId': req.user._id },
          { 'visibility.faculty': true }
        ]
      };
    } else if (req.user.role === 'department_admin') {
      const adminDepartment = req.user.academicInfo?.managedDepartment;
      
      if (!adminDepartment) {
        return res.json([]);
      }

      const normalizedDepartment = String(adminDepartment).trim().toUpperCase();

      query = {
        ...query,
        department: { $regex: new RegExp(`^${normalizedDepartment}$`, 'i') },
        'visibility.departmentAdmin': true
      };
    }

    const announcements = await Announcement.find(query)
      .populate('createdBy.userId', 'personalInfo universityId')
      .populate('relatedFeedbackForm', 'title courseName')
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private
exports.getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy.userId', 'personalInfo universityId role')
      .populate('relatedFeedbackForm', 'title courseName courseCode');

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json(announcement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private/Faculty/Department Admin (Creator only)
exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user is the creator
    if (announcement.createdBy.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this announcement' });
    }

    const { title, message, priority, status } = req.body;

    if (title) announcement.title = title;
    if (message) announcement.message = message;
    if (priority) announcement.priority = priority;
    if (status) announcement.status = status;
    announcement.updatedAt = Date.now();

    await announcement.save();

    res.json(announcement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Acknowledge announcement (for students)
// @route   POST /api/announcements/:id/acknowledge
// @access  Private/Student
exports.acknowledgeAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if already acknowledged
    const alreadyAcknowledged = announcement.acknowledgments.some(
      ack => ack.userId.toString() === req.user._id.toString()
    );

    if (alreadyAcknowledged) {
      return res.status(400).json({ message: 'Already acknowledged' });
    }

    announcement.acknowledgments.push({
      userId: req.user._id,
      acknowledgedAt: new Date()
    });

    await announcement.save();

    res.json({ message: 'Announcement acknowledged', announcement });
  } catch (error) {
    console.error('Error acknowledging announcement:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Archive announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Faculty/Department Admin (Creator only)
exports.archiveAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user is the creator or department admin
    const isCreator = announcement.createdBy.userId.toString() === req.user._id.toString();
    const isDeptAdmin = req.user.role === 'department_admin';

    if (!isCreator && !isDeptAdmin) {
      return res.status(403).json({ message: 'Not authorized to archive this announcement' });
    }

    announcement.status = 'archived';
    announcement.updatedAt = Date.now();
    await announcement.save();

    res.json({ message: 'Announcement archived', announcement });
  } catch (error) {
    console.error('Error archiving announcement:', error);
    res.status(500).json({ message: error.message });
  }
};

