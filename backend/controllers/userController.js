const User = require('../models/User');
const FeedbackForm = require('../models/FeedbackForm');
const FeedbackResponse = require('../models/FeedbackResponse');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const { role, department, search, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (role) query.role = role;
    if (department) {
      query.$or = [
        { 'academicInfo.department': department },
        { 'academicInfo.facultyDepartment': department },
        { 'academicInfo.managedDepartment': department }
      ];
    }
    if (search) {
      query.$or = [
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { universityId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create user (Bulk or Single)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const userData = req.body;

    // Check if bulk creation (array)
    if (Array.isArray(userData)) {
      const createdUsers = [];
      const errors = [];

      for (const data of userData) {
        try {
          const userExists = await User.findOne({ 
            $or: [{ email: data.email }, { universityId: data.universityId }] 
          });

          if (userExists) {
            errors.push({ 
              email: data.email, 
              error: 'User already exists' 
            });
            continue;
          }

          const user = await User.create(data);
          createdUsers.push({
            _id: user._id,
            universityId: user.universityId,
            email: user.email,
            role: user.role,
            personalInfo: user.personalInfo
          });
        } catch (err) {
          errors.push({ 
            email: data.email, 
            error: err.message 
          });
        }
      }

      res.status(201).json({
        success: createdUsers,
        errors: errors.length > 0 ? errors : undefined,
        message: `Created ${createdUsers.length} users, ${errors.length} errors`
      });
    } else {
      // Single user creation
      const userExists = await User.findOne({ 
        $or: [{ email: userData.email }, { universityId: userData.universityId }] 
      });

      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = await User.create(userData);
      res.status(201).json(user);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Don't allow password update through this endpoint
      delete req.body.password;
      
      Object.assign(user, req.body);
      const updatedUser = await user.save();
      
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // If deleting a faculty, also remove/cleanup their forms and responses
      if (user.role === 'faculty') {
        try {
          const forms = await FeedbackForm.find({ facultyId: user._id }).select('_id');
          const formIds = forms.map(f => f._id);

          if (formIds.length > 0) {
            // Delete associated responses first
            const respResult = await FeedbackResponse.deleteMany({ formId: { $in: formIds } });
            // Then delete the forms
            const formResult = await FeedbackForm.deleteMany({ _id: { $in: formIds } });
            console.log(`Cleanup on faculty delete: removed ${formResult.deletedCount} forms and ${respResult.deletedCount} responses.`);
          }
        } catch (cleanupErr) {
          console.warn('Warning: issue during faculty-related data cleanup:', cleanupErr.message);
        }
      }

      await user.deleteOne();
      res.json({ message: 'User removed and related data cleaned up (if any)' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.isActive = !user.isActive;
      await user.save();
      res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk create students from Excel
// @route   POST /api/users/bulk-students
// @access  Private/Admin
exports.bulkCreateStudents = async (req, res) => {
  try {
    const studentsData = req.body;
    const createdStudents = [];
    const errors = [];

    for (const data of studentsData) {
      try {
        // Parse section (e.g., "1A" -> year: 1, section: 1A)
        const sectionMatch = data.section?.match(/^(\d)([A-D])$/i);
        if (!sectionMatch) {
          errors.push({ regId: data.regId, error: 'Invalid section format. Use format: 1A, 2B, 3C, 4D' });
          continue;
        }
        const year = parseInt(sectionMatch[1]);
        // Store full section format (e.g., "1A") normalized to uppercase
        const section = data.section.trim().toUpperCase();

        const userExists = await User.findOne({ 
          $or: [{ email: data.email }, { universityId: data.regId }] 
        });

        if (userExists) {
          errors.push({ regId: data.regId, error: 'User already exists' });
          continue;
        }

        const user = await User.create({
          universityId: data.regId,
          email: data.email,
          password: data.regId, // regId as password
          role: 'student',
          personalInfo: {
            firstName: data.name.split(' ')[0],
            lastName: data.name.split(' ').slice(1).join(' ') || data.name.split(' ')[0],
            phone: data.mobileNumber
          },
          academicInfo: {
            department: data.department,
            program: 'B.Tech', // Default
            semester: (year - 1) * 2 + 1, // Year to semester conversion
            section: section,
            rollNumber: data.regId
          }
        });

        createdStudents.push({
          regId: data.regId,
          name: data.name,
          email: data.email,
          section: data.section,
          password: data.regId
        });
      } catch (err) {
        errors.push({ regId: data.regId, error: err.message });
      }
    }

    res.status(201).json({
      success: createdStudents,
      successCount: createdStudents.length,
      errors: errors,
      errorCount: errors.length,
      message: `Created ${createdStudents.length} students, ${errors.length} errors`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk create faculty from Excel
// @route   POST /api/users/bulk-faculty
// @access  Private/Admin
exports.bulkCreateFaculty = async (req, res) => {
  try {
    const facultyData = req.body;
    const createdFaculty = [];
    const errors = [];

    for (const data of facultyData) {
      try {
        const userExists = await User.findOne({ 
          $or: [{ email: data.email }, { universityId: data.facultyId }] 
        });

        if (userExists) {
          errors.push({ facultyId: data.facultyId, error: 'User already exists' });
          continue;
        }

        const user = await User.create({
          universityId: data.facultyId,
          email: data.email,
          password: data.mobileNumber, // mobile number as password
          role: 'faculty',
          personalInfo: {
            firstName: data.name.split(' ')[0],
            lastName: data.name.split(' ').slice(1).join(' ') || data.name.split(' ')[0],
            phone: data.mobileNumber
          },
          academicInfo: {
            facultyDepartment: data.department || 'General',
            designation: data.designation,
            expertise: data.courseName ? [data.courseName] : [],
            courses: data.courseName && data.section ? [{
              courseName: data.courseName,
              courseCode: data.courseCode || '',
              // Split comma-separated sections into array and normalize to uppercase
              sections: Array.isArray(data.section) 
                ? data.section.map(s => String(s).trim().toUpperCase())
                : data.section.split(',').map(s => s.trim().toUpperCase())
            }] : []
          }
        });

        createdFaculty.push({
          facultyId: data.facultyId,
          name: data.name,
          email: data.email,
          designation: data.designation,
          password: data.mobileNumber
        });
      } catch (err) {
        errors.push({ facultyId: data.facultyId, error: err.message });
      }
    }

    res.status(201).json({
      success: createdFaculty,
      successCount: createdFaculty.length,
      errors: errors,
      errorCount: errors.length,
      message: `Created ${createdFaculty.length} faculty, ${errors.length} errors`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk create department admins from Excel
// @route   POST /api/users/bulk-deptadmin
// @access  Private/Admin
exports.bulkCreateDeptAdmin = async (req, res) => {
  try {
    const deptAdminData = req.body;
    const createdDeptAdmins = [];
    const errors = [];

    for (const data of deptAdminData) {
      try {
        // Generate unique ID if not provided
        const deptId = data.deptId || `DEPT${Date.now()}${Math.floor(Math.random() * 1000)}`;

        const userExists = await User.findOne({ 
          $or: [{ email: data.email }, { universityId: deptId }] 
        });

        if (userExists) {
          errors.push({ email: data.email, error: 'User already exists' });
          continue;
        }

        const user = await User.create({
          universityId: deptId,
          email: data.email,
          password: data.mobileNumber, // mobile number as password
          role: 'department_admin',
          personalInfo: {
            firstName: data.name.split(' ')[0],
            lastName: data.name.split(' ').slice(1).join(' ') || data.name.split(' ')[0],
            phone: data.mobileNumber
          },
          academicInfo: {
            managedDepartment: data.department
          }
        });

        createdDeptAdmins.push({
          deptId: deptId,
          name: data.name,
          email: data.email,
          department: data.department,
          password: data.mobileNumber
        });
      } catch (err) {
        errors.push({ email: data.email, error: err.message });
      }
    }

    res.status(201).json({
      success: createdDeptAdmins,
      successCount: createdDeptAdmins.length,
      errors: errors,
      errorCount: errors.length,
      message: `Created ${createdDeptAdmins.length} department admins, ${errors.length} errors`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get faculty's courses from User model (Excel data)
// @route   GET /api/users/:id/courses
// @access  Private
exports.getFacultyCourseInfo = async (req, res) => {
  try {
    const faculty = await User.findById(req.params.id);
    
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Return courses from Excel upload data
    const coursesInfo = faculty.academicInfo.courses || [];
    
    res.json({
      facultyId: faculty._id,
      facultyName: `${faculty.personalInfo.firstName} ${faculty.personalInfo.lastName}`,
      department: faculty.academicInfo.facultyDepartment,
      designation: faculty.academicInfo.designation,
      courses: coursesInfo
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fix faculty sections (migration helper)
// @route   POST /api/users/fix-faculty-sections
// @access  Private/Admin
exports.fixFacultySections = async (req, res) => {
  try {
    const faculty = await User.find({ role: 'faculty' });
    let updated = 0;

    for (const fac of faculty) {
      let needsUpdate = false;
      
      if (fac.academicInfo?.courses) {
        fac.academicInfo.courses = fac.academicInfo.courses.map(course => {
          if (course.sections && course.sections.length > 0) {
            // Check if any section contains comma (needs splitting)
            const newSections = [];
            course.sections.forEach(section => {
              if (typeof section === 'string' && section.includes(',')) {
                // Split comma-separated sections
                newSections.push(...section.split(',').map(s => s.trim()));
                needsUpdate = true;
              } else {
                newSections.push(section);
              }
            });
            course.sections = newSections;
          }
          return course;
        });
      }

      if (needsUpdate) {
        await fac.save();
        updated++;
      }
    }

    res.json({
      message: `Fixed sections for ${updated} faculty members`,
      totalFaculty: faculty.length,
      updated: updated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fix student sections (migration helper) - converts "A" to "1A", "B" to "1B" etc based on semester
// @route   POST /api/users/fix-student-sections
// @access  Private/Admin
exports.fixStudentSections = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' });
    let updated = 0;

    for (const student of students) {
      let needsUpdate = false;
      
      if (student.academicInfo?.section) {
        const currentSection = student.academicInfo.section;
        
        // If section is just a letter (A, B, C, D), prepend year based on semester
        if (/^[A-D]$/i.test(currentSection)) {
          const semester = student.academicInfo.semester || 1;
          const year = Math.ceil(semester / 2); // Convert semester to year (1-2 -> 1, 3-4 -> 2, etc.)
          student.academicInfo.section = `${year}${currentSection.toUpperCase()}`;
          needsUpdate = true;
        } else {
          // Just normalize to uppercase if it's already in full format
          const normalized = currentSection.trim().toUpperCase();
          if (normalized !== currentSection) {
            student.academicInfo.section = normalized;
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        await student.save();
        updated++;
      }
    }

    res.json({
      message: `Fixed sections for ${updated} students`,
      totalStudents: students.length,
      updated: updated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
