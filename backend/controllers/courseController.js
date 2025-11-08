const Course = require('../models/Course');
const CourseOffering = require('../models/CourseOffering');
const FacultyAssignment = require('../models/FacultyAssignment');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
exports.getCourses = async (req, res) => {
  try {
    const { department, isActive, search } = req.query;
    let query = {};

    if (department) query.department = department;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { courseCode: { $regex: search, $options: 'i' } },
        { courseName: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query).sort({ courseCode: 1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private/Admin
exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Private
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (course) {
      res.json(course);
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (course) {
      Object.assign(course, req.body);
      const updatedCourse = await course.save();
      res.json(updatedCourse);
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (course) {
      await course.deleteOne();
      res.json({ message: 'Course deleted' });
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== COURSE OFFERINGS =====

// @desc    Get all course offerings
// @route   GET /api/courses/offerings
// @access  Private
exports.getCourseOfferings = async (req, res) => {
  try {
    const { semester, academicYear, status } = req.query;
    let query = {};

    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;

    const offerings = await CourseOffering.find(query)
      .populate('courseId')
      .populate('sections.enrolledStudents', 'personalInfo universityId')
      .sort({ startDate: -1 });

    res.json(offerings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create course offering
// @route   POST /api/courses/offerings
// @access  Private/Admin
exports.createCourseOffering = async (req, res) => {
  try {
    const offering = await CourseOffering.create(req.body);
    res.status(201).json(offering);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get course offering by ID
// @route   GET /api/courses/offerings/:id
// @access  Private
exports.getCourseOfferingById = async (req, res) => {
  try {
    const offering = await CourseOffering.findById(req.params.id)
      .populate('courseId')
      .populate('sections.enrolledStudents', 'personalInfo universityId academicInfo');

    if (offering) {
      res.json(offering);
    } else {
      res.status(404).json({ message: 'Course offering not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update course offering
// @route   PUT /api/courses/offerings/:id
// @access  Private/Admin
exports.updateCourseOffering = async (req, res) => {
  try {
    const offering = await CourseOffering.findById(req.params.id);
    if (offering) {
      Object.assign(offering, req.body);
      const updatedOffering = await offering.save();
      res.json(updatedOffering);
    } else {
      res.status(404).json({ message: 'Course offering not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Enroll student in course section
// @route   POST /api/courses/offerings/:id/enroll
// @access  Private/Admin
exports.enrollStudent = async (req, res) => {
  try {
    const { studentId, sectionName } = req.body;
    const offering = await CourseOffering.findById(req.params.id);

    if (!offering) {
      return res.status(404).json({ message: 'Course offering not found' });
    }

    const section = offering.sections.find(s => s.sectionName === sectionName);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    if (section.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ message: 'Student already enrolled' });
    }

    section.enrolledStudents.push(studentId);
    await offering.save();

    res.json({ message: 'Student enrolled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get faculty's courses
// @route   GET /api/courses/faculty/:facultyId
// @access  Private
exports.getFacultyCourses = async (req, res) => {
  try {
    const assignments = await FacultyAssignment.find({
      facultyId: req.params.facultyId,
      status: 'active'
    }).populate({
      path: 'courseOfferingId',
      populate: { path: 'courseId' }
    });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign faculty to course
// @route   POST /api/courses/assignments
// @access  Private/Admin
exports.assignFaculty = async (req, res) => {
  try {
    const assignment = await FacultyAssignment.create(req.body);
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
