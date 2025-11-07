const Course = require('../models/Course');
const CourseOffering = require('../models/CourseOffering');
const User = require('../models/User');
const FeedbackForm = require('../models/FeedbackForm');
const FeedbackResponse = require('../models/FeedbackResponse');
const FacultyAssignment = require('../models/FacultyAssignment');

// @desc    Get all faculty with their expertise
// @route   GET /api/department/faculty
// @access  Private (Department Admin)
exports.getAllFaculty = async (req, res) => {
  try {
    // Get department from logged-in admin's profile
    const department = req.user.academicInfo?.managedDepartment;
    
    if (!department) {
      return res.status(400).json({ message: 'No department assigned to this admin' });
    }

    console.log('👥 Loading faculty for department:', department);

    const faculty = await User.find({ 
      role: 'faculty', 
      isActive: true,
      'academicInfo.facultyDepartment': department 
    })
      .select('universityId email personalInfo academicInfo')
      .sort({ 'personalInfo.lastName': 1 });

    const facultyList = faculty.map(f => ({
      _id: f._id,
      universityId: f.universityId,
      name: `${f.personalInfo.firstName} ${f.personalInfo.lastName}`,
      email: f.email,
      department: f.academicInfo.facultyDepartment,
      designation: f.academicInfo.designation,
      expertise: f.academicInfo.expertise || [],
      courses: f.academicInfo.courses || []
    }));

    res.json(facultyList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign faculty to course section
// @route   POST /api/department/assign-faculty
// @access  Private (Department Admin)
exports.assignFacultyToSection = async (req, res) => {
  try {
    const { courseOfferingId, sectionName, facultyId } = req.body;

    const offering = await CourseOffering.findById(courseOfferingId);
    if (!offering) {
      return res.status(404).json({ message: 'Course offering not found' });
    }

    const section = offering.sections.find(s => s.sectionName === sectionName);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Verify faculty exists and has relevant expertise
    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Assign faculty to section
    section.facultyId = facultyId;
    await offering.save();

    // Create or update faculty assignment record
    let assignment = await FacultyAssignment.findOne({
      facultyId,
      courseOfferingId,
      sections: sectionName
    });

    if (!assignment) {
      assignment = await FacultyAssignment.create({
        facultyId,
        courseOfferingId,
        sections: [sectionName],
        role: 'primary',
        status: 'active',
        startDate: offering.startDate,
        endDate: offering.endDate
      });
    }

    res.json({
      message: 'Faculty assigned successfully',
      offering: await offering.populate('courseId sections.facultyId')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get overall analytics for department
// @route   GET /api/department/analytics/overall
// @access  Private (Department Admin)
exports.getOverallAnalytics = async (req, res) => {
  try {
    // Get department from logged-in admin's profile
    const department = req.user.academicInfo?.managedDepartment;
    
    if (!department) {
      return res.status(400).json({ message: 'No department assigned to this admin' });
    }

    console.log('🏢 Loading analytics for department:', department);

    // Get all courses in department
    const courses = await Course.find({ department });
    const courseIds = courses.map(c => c._id);

    // Get all course offerings
    const offerings = await CourseOffering.find({ courseId: { $in: courseIds }, status: 'active' });
    const offeringIds = offerings.map(o => o._id);

    // Get all feedback forms
    const forms = await FeedbackForm.find({ courseOfferingId: { $in: offeringIds } });
    const formIds = forms.map(f => f._id);

    // Get all responses - IMPORTANT: FeedbackResponse model uses 'formId', not 'feedbackFormId'
    const responses = await FeedbackResponse.find({ formId: { $in: formIds } });

    // Calculate metrics
    const totalStudents = await User.countDocuments({ 
      role: 'student', 
      'academicInfo.department': department,
      isActive: true 
    });

    const totalFaculty = await User.countDocuments({ 
      role: 'faculty', 
      'academicInfo.facultyDepartment': department,
      isActive: true 
    });

    const totalForms = forms.length;
    const totalResponses = responses.length;
    const avgResponseRate = totalForms > 0 ? ((totalResponses / (totalForms * 30)) * 100).toFixed(1) : 0; // Assuming avg 30 students per form

    // Calculate average satisfaction
    let totalRating = 0;
    let ratingCount = 0;

    responses.forEach(response => {
      // FeedbackResponse model uses 'responses' array, not 'answers'
      response.responses.forEach(answer => {
        if (answer.type === 'rating' && answer.rating) {
          totalRating += answer.rating;
          ratingCount++;
        }
      });
    });

    const avgSatisfaction = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

    res.json({
      department,
      metrics: {
        totalCourses: courses.length,
        totalStudents,
        totalFaculty,
        activeCourseOfferings: offerings.length,
        totalFeedbackForms: totalForms,
        totalResponses,
        avgResponseRate: parseFloat(avgResponseRate),
        avgSatisfaction: parseFloat(avgSatisfaction)
      },
      courses: courses.map(c => ({
        _id: c._id,
        code: c.courseCode,
        name: c.courseName,
        credits: c.credits
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get course-wise analytics
// @route   GET /api/department/analytics/course/:courseId
// @access  Private (Department Admin)
exports.getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Get department from logged-in admin's profile
    const department = req.user.academicInfo?.managedDepartment;
    
    if (!department) {
      return res.status(400).json({ message: 'No department assigned to this admin' });
    }

    console.log('🔍 Looking for course:', courseId, 'in department:', department);

    // Try to find course in Course collection first
    let course;
    try {
      course = await Course.findById(courseId);
    } catch (err) {
      // Not a valid ObjectId, search by code or name
      console.log('Not a valid ObjectId, searching by code/name');
    }
    
    if (!course) {
      course = await Course.findOne({ 
        department,
        $or: [
          { courseCode: courseId },
          { courseName: courseId }
        ]
      });
    }
    
    // If no course found in Course collection, look in faculty data
    if (!course) {
      console.log('📚 Course not found in Course collection, checking faculty data...');
      
      // Find faculty in this department who teach this course
      const faculty = await User.find({
        role: 'faculty',
        'academicInfo.facultyDepartment': department,
        'academicInfo.courses': {
          $elemMatch: {
            $or: [
              { courseName: courseId },
              { courseCode: courseId }
            ]
          }
        }
      });
      
      console.log(`👨‍🏫 Found ${faculty.length} faculty teaching this course`);
      
      if (faculty.length === 0) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Extract course info from first faculty member
      const firstFacultyCourse = faculty[0].academicInfo.courses.find(
        c => c.courseName === courseId || c.courseCode === courseId
      );
      
      // Create a virtual course object
      course = {
        _id: null,
        courseCode: firstFacultyCourse.courseCode || courseId,
        courseName: firstFacultyCourse.courseName || courseId,
        department: department,
        credits: firstFacultyCourse.credits || 3
      };
      
      console.log('📝 Using virtual course from faculty data:', course);
    } else {
      // Verify course belongs to admin's department
      if (course.department !== department) {
        return res.status(403).json({ message: 'Access denied. Course does not belong to your department.' });
      }
    }

    console.log('📚 Loading course analytics:', course.courseName, 'for department:', department);

    // Get feedback forms for this course (by courseName since that's what's stored in forms)
    const forms = await FeedbackForm.find({
      courseName: { $regex: new RegExp(`^${course.courseName}$`, 'i') }
    }).populate('facultyId', 'personalInfo academicInfo');
    
    console.log(`📋 Found ${forms.length} forms for course ${course.courseName}`);
    
    const formIds = forms.map(f => f._id);
    
    // Get all responses - IMPORTANT: FeedbackResponse model uses 'formId', not 'feedbackFormId'
    const responses = await FeedbackResponse.find({ formId: { $in: formIds } });
    
    console.log(`💬 Found ${responses.length} responses`);

    // Get faculty teaching this course
    const facultyTeaching = await User.find({
      role: 'faculty',
      'academicInfo.facultyDepartment': department,
      'academicInfo.courses.courseName': course.courseName
    }).select('universityId personalInfo academicInfo');
    
    // Group by faculty to create faculty array
    const facultyMap = new Map();
    
    for (const fac of facultyTeaching) {
      const facultyCourse = fac.academicInfo.courses.find(
        c => c.courseName === course.courseName
      );
      
      if (facultyCourse) {
        const facultyForms = forms.filter(f => 
          f.facultyId && f.facultyId._id.toString() === fac._id.toString()
        );
        
        const facultyFormIds = facultyForms.map(f => f._id);
        const facultyResponses = responses.filter(r => 
          facultyFormIds.some(id => id.toString() === r.formId.toString())
        );
        
        // Calculate ratings
        let totalRatings = 0;
        let ratingCount = 0;
        
        facultyResponses.forEach(response => {
          // FeedbackResponse model uses 'responses' array, not 'answers'
          response.responses.forEach(answer => {
            if (answer.type === 'rating' && answer.rating) {
              totalRatings += answer.rating;
              ratingCount++;
            }
          });
        });
        
        facultyMap.set(fac._id.toString(), {
          facultyId: fac._id,
          name: `${fac.personalInfo.firstName} ${fac.personalInfo.lastName}`,
          facultyName: `${fac.personalInfo.firstName} ${fac.personalInfo.lastName}`, // Keep for backwards compatibility
          universityId: fac.universityId || 'N/A',
          sections: facultyCourse.sections || [],
          totalForms: facultyForms.length,
          totalResponses: facultyResponses.length,
          averageRating: ratingCount > 0 ? parseFloat((totalRatings / ratingCount).toFixed(2)) : 0
        });
      }
    }
    
    const facultyArray = Array.from(facultyMap.values());

    // Calculate overall metrics
    let totalRating = 0;
    let ratingCount = 0;
    
    responses.forEach(response => {
      // FeedbackResponse model uses 'responses' array, not 'answers'
      response.responses.forEach(answer => {
        if (answer.type === 'rating' && answer.rating) {
          totalRating += answer.rating;
          ratingCount++;
        }
      });
    });

    // Calculate rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    responses.forEach(response => {
      response.responses.forEach(answer => {
        if (answer.type === 'rating' && answer.rating && answer.rating >= 1 && answer.rating <= 5) {
          ratingDistribution[answer.rating]++;
        }
      });
    });

    res.json({
      course: {
        _id: course._id,
        code: course.courseCode,
        name: course.courseName,
        department: course.department,
        credits: course.credits
      },
      overall: {
        averageRating: ratingCount > 0 ? parseFloat((totalRating / ratingCount).toFixed(2)) : 0,
        totalForms: forms.length,
        totalResponses: responses.length,
        ratingDistribution
      },
      faculty: facultyArray
    });
  } catch (error) {
    console.error('Error in getCourseAnalytics:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get section-wise detailed analytics
// @route   GET /api/department/analytics/section/:offeringId/:sectionName
// @access  Private (Department Admin)
exports.getSectionAnalytics = async (req, res) => {
  try {
    const { offeringId, sectionName } = req.params;

    const offering = await CourseOffering.findById(offeringId)
      .populate('courseId')
      .populate('sections.facultyId', 'personalInfo academicInfo')
      .populate('sections.enrolledStudents', 'universityId personalInfo email');

    if (!offering) {
      return res.status(404).json({ message: 'Course offering not found' });
    }

    const section = offering.sections.find(s => s.sectionName === sectionName);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Get feedback forms for this section
    const forms = await FeedbackForm.find({
      courseOfferingId: offeringId,
      targetSections: sectionName
    }).sort({ createdAt: -1 });

    const formIds = forms.map(f => f._id);

    // Get all responses - IMPORTANT: FeedbackResponse model uses 'formId', not 'feedbackFormId'
    const responses = await FeedbackResponse.find({ formId: { $in: formIds } })
      .populate('studentId', 'universityId personalInfo');

    // Student-wise response tracking
    const studentMetrics = section.enrolledStudents.map(student => {
      const studentResponses = responses.filter(r => 
        r.studentId && r.studentId._id.toString() === student._id.toString()
      );

      let totalRating = 0;
      let ratingCount = 0;

      studentResponses.forEach(response => {
        // FeedbackResponse model uses 'responses' array, not 'answers'
        response.responses.forEach(answer => {
          if (answer.type === 'rating' && answer.rating) {
            totalRating += answer.rating;
            ratingCount++;
          }
        });
      });

      const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

      return {
        studentId: student._id,
        universityId: student.universityId,
        name: `${student.personalInfo.firstName} ${student.personalInfo.lastName}`,
        email: student.email,
        responsesSubmitted: studentResponses.length,
        totalForms: forms.length,
        responseRate: forms.length > 0 ? ((studentResponses.length / forms.length) * 100).toFixed(1) : 0,
        avgRating: parseFloat(avgRating)
      };
    });

    // Question-wise analytics
    const questionAnalytics = [];
    
    forms.forEach(form => {
      form.questions.forEach((question, qIndex) => {
        const questionResponses = responses
          .filter(r => r.feedbackFormId.toString() === form._id.toString())
          .map(r => r.answers[qIndex])
          .filter(a => a);

        if (question.type === 'rating') {
          const ratings = questionResponses.map(a => a.rating).filter(r => r);
          const avgRating = ratings.length > 0 ?
            (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1) : 0;

          const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          ratings.forEach(r => {
            if (r >= 1 && r <= 5) distribution[r]++;
          });

          questionAnalytics.push({
            formId: form._id,
            formTitle: form.title,
            question: question.questionText,
            type: 'rating',
            avgRating: parseFloat(avgRating),
            totalResponses: ratings.length,
            distribution
          });
        }
      });
    });

    res.json({
      course: {
        code: offering.courseId.courseCode,
        name: offering.courseId.courseName
      },
      section: {
        fullName: `${offering.year}${section.sectionName}`, // e.g., "2A"
        year: offering.year,
        name: section.sectionName,
        faculty: section.facultyId ? {
          name: `${section.facultyId.personalInfo.firstName} ${section.facultyId.personalInfo.lastName}`,
          designation: section.facultyId.academicInfo.designation,
          expertise: section.facultyId.academicInfo.expertise
        } : null,
        schedule: section.schedule,
        totalStudents: section.enrolledStudents.length
      },
      metrics: {
        totalForms: forms.length,
        totalResponses: responses.length,
        avgResponseRate: studentMetrics.length > 0 ?
          (studentMetrics.reduce((sum, s) => sum + parseFloat(s.responseRate), 0) / studentMetrics.length).toFixed(1) : 0,
        overallAvgRating: questionAnalytics.length > 0 ?
          (questionAnalytics.reduce((sum, q) => sum + q.avgRating, 0) / questionAnalytics.length).toFixed(1) : 0
      },
      studentMetrics,
      questionAnalytics,
      recentForms: forms.slice(0, 5).map(f => ({
        _id: f._id,
        title: f.title,
        type: f.type,
        status: f.status,
        createdAt: f.createdAt,
        responsesReceived: responses.filter(r => r.feedbackFormId.toString() === f._id.toString()).length
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create course offering with sections
// @route   POST /api/department/course-offerings
// @access  Private (Department Admin)
exports.createCourseOffering = async (req, res) => {
  try {
    const { courseId, semester, academicYear, sections } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get all students for this semester
    const User = require('../models/User');
    const students = await User.find({ 
      role: 'student',
      'academicInfo.semester': semester
    });

    // Auto-populate sections with students based on their section
    const populatedSections = await Promise.all(sections.map(async (s) => {
      // Get students in this section for this semester
      const sectionStudents = students
        .filter(student => student.academicInfo.section === s.sectionName)
        .map(student => student._id);

      // Assign faculty to section
      if (s.facultyId) {
        await require('../models/FacultyAssignment').create({
          facultyId: s.facultyId,
          courseOfferingId: null, // Will update after creating offering
          sectionName: s.sectionName,
          semester,
          academicYear
        });
      }

      return {
        sectionName: s.sectionName,
        facultyId: s.facultyId,
        enrolledStudents: sectionStudents,
        maxCapacity: sectionStudents.length + 10 // Auto capacity
      };
    }));

    const offering = await CourseOffering.create({
      courseId,
      semester,
      academicYear,
      sections: populatedSections,
      status: 'active'
    });

    // Update faculty assignments with offering ID
    for (const section of sections) {
      if (section.facultyId) {
        await require('../models/FacultyAssignment').updateMany(
          { 
            facultyId: section.facultyId,
            sectionName: section.sectionName,
            semester,
            academicYear,
            courseOfferingId: null
          },
          { courseOfferingId: offering._id }
        );
      }
    }

    res.status(201).json({
      message: 'Course offering created successfully',
      offering: await offering.populate('courseId')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get faculty performance data
// @route   GET /api/department/faculty/:facultyId/performance
// @access  Private (Department Admin)
exports.getFacultyPerformance = async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    // Get department from logged-in admin's profile
    const adminDepartment = req.user.academicInfo?.managedDepartment;
    
    if (!adminDepartment) {
      return res.status(400).json({ message: 'No department assigned to this admin' });
    }

    // Verify faculty exists and belongs to department
    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    if (faculty.academicInfo.facultyDepartment !== adminDepartment) {
      return res.status(403).json({ message: 'Faculty does not belong to your department' });
    }

    console.log('📊 Loading performance for faculty:', faculty.personalInfo.firstName, faculty.personalInfo.lastName);

    // Get all course offerings where this faculty is assigned
    const offerings = await CourseOffering.find({
      'sections.facultyId': facultyId,
      status: 'active'
    })
      .populate('courseId', 'courseCode courseName')
      .populate('sections.facultyId', 'personalInfo');

    // Get all feedback forms created by this faculty
    const forms = await FeedbackForm.find({ facultyId })
      .populate('courseOfferingId')
      .sort({ createdAt: 1 });

    // Get all responses for these forms
    const formIds = forms.map(f => f._id);
    const responses = await FeedbackResponse.find({ formId: { $in: formIds } });

    // Calculate performance by form
    const performanceByForm = [];
    const sectionsSet = new Set();
    let totalResponses = 0;
    const allRatings = [];

    for (const form of forms) {
      const formResponses = responses.filter(r => 
        r.formId.toString() === form._id.toString()
      );

      // Get course offering to find sections
      const offering = await CourseOffering.findById(form.courseOfferingId)
        .populate('courseId', 'courseCode courseName');
      if (offering) {
        // Derive year from students' sections (e.g., "2A" -> year: 2)
        let year = null;
        if (offering.sections.length > 0 && offering.sections[0].enrolledStudents && offering.sections[0].enrolledStudents.length > 0) {
          // Get first student to determine year
          const firstStudentId = offering.sections[0].enrolledStudents[0];
          const firstStudent = await User.findById(firstStudentId).select('academicInfo.section');
          if (firstStudent && firstStudent.academicInfo && firstStudent.academicInfo.section) {
            const sectionMatch = firstStudent.academicInfo.section.match(/^(\d)/);
            if (sectionMatch) {
              year = parseInt(sectionMatch[1]);
            }
          }
        }
        
        // Get sections this form targets
        for (const targetSection of form.targetSections) {
          const section = offering.sections.find(s => s.sectionName === targetSection);
          if (section) {
            const fullSectionName = year ? `${year}${targetSection}` : targetSection;
            sectionsSet.add(JSON.stringify({
              section: targetSection,
              fullSection: fullSectionName,
              courseId: offering.courseId._id,
              courseCode: offering.courseId.courseCode,
              courseName: offering.courseId.courseName,
              offeringId: offering._id,
              year: year
            }));

            // Get students in this section
            const sectionStudents = section.enrolledStudents || [];
            const sectionResponses = formResponses.filter(r => {
              // Check if student is in this section
              return sectionStudents.some(sId => sId.toString() === r.studentId.toString());
            });

            totalResponses += sectionResponses.length;

            // Calculate average rating for this form
            let totalRating = 0;
            let ratingCount = 0;

            sectionResponses.forEach((response) => {
              response.responses.forEach((ans) => {
                if (ans.rating && ans.rating >= 1 && ans.rating <= 5) {
                  totalRating += ans.rating;
                  ratingCount++;
                  allRatings.push(ans.rating);
                }
              });
            });

            const avgRating = ratingCount > 0 ? (totalRating / ratingCount) : 0;

            performanceByForm.push({
              formTitle: form.title,
              formId: form._id,
              section: targetSection,
              fullSection: fullSectionName,
              courseCode: offering.courseId.courseCode,
              courseName: offering.courseId.courseName,
              avgRating: parseFloat(avgRating.toFixed(2)),
              responseCount: sectionResponses.length,
              totalStudents: sectionStudents.length,
              responseRate: sectionStudents.length > 0 
                ? parseFloat(((sectionResponses.length / sectionStudents.length) * 100).toFixed(1))
                : 0,
              createdAt: form.createdAt,
            });
          }
        }
      }
    }

    // Sort by date to show trend
    performanceByForm.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Calculate overall metrics
    const overallRating = allRatings.length > 0
      ? parseFloat((allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(2))
      : 0;

    // Calculate trend (comparing last form to first form)
    const trend = performanceByForm.length >= 2
      ? parseFloat((performanceByForm[performanceByForm.length - 1].avgRating - performanceByForm[0].avgRating).toFixed(2))
      : 0;

    // Get unique sections
    const sections = Array.from(sectionsSet).map(s => JSON.parse(s));

    res.json({
      faculty: {
        _id: faculty._id,
        universityId: faculty.universityId,
        name: `${faculty.personalInfo.firstName} ${faculty.personalInfo.lastName}`,
        email: faculty.email,
        department: faculty.academicInfo.facultyDepartment,
        designation: faculty.academicInfo.designation,
        expertise: faculty.academicInfo.expertise || []
      },
      performance: {
        overallRating,
        totalForms: forms.length,
        totalResponses,
        trend,
        sections,
        performanceByForm
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get forms for a specific section
// @route   GET /api/department/faculty/:facultyId/sections/:offeringId/:sectionName/forms
// @access  Private (Department Admin)
exports.getSectionForms = async (req, res) => {
  try {
    const { facultyId, offeringId, sectionName } = req.params;

    // Verify faculty exists
    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Verify offering and section exist
    const offering = await CourseOffering.findById(offeringId)
      .populate('courseId', 'courseCode courseName');
    
    if (!offering) {
      return res.status(404).json({ message: 'Course offering not found' });
    }

    const section = offering.sections.find(s => s.sectionName === sectionName);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Get forms for this section created by this faculty
    const forms = await FeedbackForm.find({
      facultyId,
      courseOfferingId: offeringId,
      targetSections: sectionName
    })
      .sort({ createdAt: -1 });

    // Get responses for each form
    const formIds = forms.map(f => f._id);
    const responses = await FeedbackResponse.find({ formId: { $in: formIds } });

    // Get total students in section
    const totalStudents = section.enrolledStudents ? section.enrolledStudents.length : 0;

    // Enrich forms with response data
    const formsWithData = forms.map(form => {
      const formResponses = responses.filter(r => 
        r.formId.toString() === form._id.toString()
      );
      
      // Filter responses to only include students in this section
      const sectionResponses = formResponses.filter(r => {
        return section.enrolledStudents.some(sId => 
          sId.toString() === r.studentId.toString()
        );
      });

      return {
        _id: form._id,
        title: form.title,
        type: form.type,
        status: form.status,
        createdAt: form.createdAt,
        schedule: form.schedule,
        responseCount: sectionResponses.length,
        totalStudents,
        responseRate: totalStudents > 0 
          ? parseFloat(((sectionResponses.length / totalStudents) * 100).toFixed(1))
          : 0
      };
    });

    // Derive year from students' sections
    let year = null;
    if (section.enrolledStudents && section.enrolledStudents.length > 0) {
      const students = await User.find({ _id: { $in: section.enrolledStudents } })
        .select('academicInfo.section');
      if (students.length > 0 && students[0].academicInfo && students[0].academicInfo.section) {
        const sectionMatch = students[0].academicInfo.section.match(/^(\d)/);
        if (sectionMatch) {
          year = parseInt(sectionMatch[1]);
        }
      }
    }
    const fullSection = year ? `${year}${sectionName}` : sectionName;

    res.json({
      section: {
        sectionName,
        fullSection: fullSection,
        courseCode: offering.courseId.courseCode,
        courseName: offering.courseId.courseName,
        totalStudents
      },
      forms: formsWithData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @route   GET /api/department/forms/:formId/responses
// @access  Private (Department Admin)
exports.getFormResponsesVisualization = async (req, res) => {
  try {
    const { formId } = req.params;

    // Get form
    const form = await FeedbackForm.findById(formId)
      .populate('courseOfferingId')
      .populate('facultyId', 'personalInfo');

    if (!form) {
      return res.status(404).json({ message: 'Feedback form not found' });
    }

    // Get offering and sections (optional)
    const offering = form.courseOfferingId ? await CourseOffering.findById(form.courseOfferingId) : null;

    // Get all responses for this form
    const responses = await FeedbackResponse.find({ formId })
      .populate('studentId', 'universityId personalInfo academicInfo');

    // Calculate total students in target sections
    let totalStudents = 0;
    const targetSections = form.targetSections || [];
    
    if (offering && Array.isArray(offering.sections)) {
      for (const sectionName of targetSections) {
        const section = offering.sections.find(s => s.sectionName === sectionName);
        if (section && Array.isArray(section.enrolledStudents)) {
          totalStudents += section.enrolledStudents.length;
        }
      }
    } else {
      // Fallback: estimate from unique student responses when offering data not available
      const uniqueStudentIds = new Set(responses.map(r => r.studentId?.toString()).filter(Boolean));
      totalStudents = Math.max(uniqueStudentIds.size, 0);
    }

    // Filter responses to only include students in target sections
    const validResponses = responses.filter(r => {
      if (!r.studentId || !r.studentId.academicInfo) return true; // keep when we cannot determine section
      const studentSection = r.studentId.academicInfo.section;
      return targetSections.length ? targetSections.includes(studentSection) : true;
    });

    // Analyze responses by question
    const questionAnalysis = [];

    form.questions.forEach((question, qIndex) => {
      const questionId = (question.questionId || question._id).toString();
      const questionResponses = validResponses
        .map(r => {
          const response = r.responses.find(ans => 
            ans.questionId && ans.questionId.toString() === questionId
          );
          return response;
        })
        .filter(Boolean);

      if (question.type === 'rating') {
        // Rating analysis
        const ratings = questionResponses
          .map(r => {
            const val = r.rating ?? (r.type === 'rating' ? r.answer : undefined);
            const num = Number(val);
            return Number.isFinite(num) ? num : null;
          })
          .filter(r => Number.isFinite(r) && r >= 1 && r <= 5);

        const avgRating = ratings.length > 0
          ? parseFloat((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2))
          : 0;

        // Count distribution
        const distribution = [1, 2, 3, 4, 5].map(rating => ({
          rating: `${rating} Star${rating > 1 ? 's' : ''}`,
          count: ratings.filter(r => r === rating).length,
        }));

        questionAnalysis.push({
          question: question.questionText,
          type: 'rating',
          avgRating,
          totalResponses: ratings.length,
          distribution,
        });
      } else if (question.type === 'multiple_choice') {
        // MCQ analysis
        const optionCounts = {};
        (question.options || []).forEach(opt => {
          optionCounts[opt] = 0;
        });

        questionResponses.forEach(r => {
          const selected = r.selectedOption ?? (r.type === 'multiple_choice' ? r.answer : undefined);
          if (selected && optionCounts[selected] !== undefined) {
            optionCounts[selected]++;
          }
        });

        const distribution = Object.entries(optionCounts).map(([option, count]) => ({
          option,
          count,
          percentage: questionResponses.length > 0
            ? parseFloat(((count / questionResponses.length) * 100).toFixed(1))
            : 0,
        }));

        questionAnalysis.push({
          question: question.questionText,
          type: 'multiple_choice',
          totalResponses: questionResponses.length,
          distribution,
        });
      } else if (question.type === 'text') {
        // Text responses
        const textResponses = questionResponses
          .map(r => r.textResponse ?? (r.type === 'text' ? r.answer : undefined))
          .filter(Boolean);

        questionAnalysis.push({
          question: question.questionText,
          type: 'text',
          totalResponses: textResponses.length,
          responses: textResponses,
        });
      }
    });

    res.json({
      form: {
        _id: form._id,
        title: form.title,
        type: form.type,
        status: form.status,
        createdAt: form.createdAt,
        courseCode: offering?.courseId?.courseCode || form.courseCode,
        courseName: offering?.courseId?.courseName || form.courseName,
        targetSections: form.targetSections,
        facultyName: form.facultyId 
          ? `${form.facultyId.personalInfo.firstName} ${form.facultyId.personalInfo.lastName}`
          : 'Unknown'
      },
      summary: {
        totalStudents,
        respondedCount: validResponses.length,
        notRespondedCount: totalStudents - validResponses.length,
        responseRate: totalStudents > 0 
          ? parseFloat(((validResponses.length / totalStudents) * 100).toFixed(1))
          : 0
      },
      questionAnalysis
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get faculty form analytics with section filtering (aggregated data only)
// @route   GET /api/department/faculty/:facultyId/forms/:formId/analytics
// @access  Private (Faculty)
exports.getFacultyFormAnalytics = async (req, res) => {
  try {
    const { facultyId, formId } = req.params;
    const { section } = req.query; // optional section filter

    console.log('📊 Faculty Form Analytics Request:');
    console.log('  Faculty ID:', facultyId);
    console.log('  Form ID:', formId);
    console.log('  Section Filter:', section);

    const form = await FeedbackForm.findById(formId);
    if (!form || form.facultyId.toString() !== facultyId) {
      return res.status(404).json({ message: 'Form not found or access denied' });
    }

    // Get responses - faculty can only see aggregated data
    const responses = await FeedbackResponse.find({ formId }).populate('studentId', 'academicInfo.section');
    console.log('  Total Responses:', responses.length);

    // Filter by section if specified
    let filteredResponses = responses;
    if (section) {
      console.log('  Filtering by section:', section);
      
      // Try multiple filtering strategies
      // Strategy 1: Use populated student academicInfo.section
      filteredResponses = responses.filter(r => {
        const studentSection = r.studentId?.academicInfo?.section;
        if (!studentSection) return false;
        
        // Normalize both values for comparison
        const normalizedStudentSection = String(studentSection).trim().toUpperCase();
        const normalizedFilterSection = String(section).trim().toUpperCase();
        
        // Try exact match and variants (with/without year prefix)
        if (normalizedStudentSection === normalizedFilterSection) return true;
        if (normalizedStudentSection === '1' + normalizedFilterSection) return true;
        if ('1' + normalizedStudentSection === normalizedFilterSection) return true;
        if (normalizedStudentSection.replace(/^[0-9]+/, '') === normalizedFilterSection.replace(/^[0-9]+/, '')) return true;
        
        return false;
      });

      console.log('  Filtered Responses:', filteredResponses.length);
    }

    // Aggregate analysis by question (no individual student data)
    const questionAnalysis = [];

    form.questions.forEach((question, qIndex) => {
      const questionId = (question.questionId || question._id).toString();
      const questionResponses = filteredResponses
        .map(r => r.responses.find(resp => resp.questionId && resp.questionId.toString() === questionId))
        .filter(Boolean);

      if (question.type === 'rating') {
        const ratings = questionResponses
          .map(r => r.rating || r.answer)
          .filter(r => Number.isFinite(Number(r)) && Number(r) >= 1 && Number(r) <= 5)
          .map(r => Number(r));

        const avgRating = ratings.length > 0
          ? parseFloat((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2))
          : 0;

        const distribution = [1, 2, 3, 4, 5].map(rating => ({
          rating: `${rating} Star${rating > 1 ? 's' : ''}`,
          count: ratings.filter(r => r === rating).length,
          percentage: ratings.length > 0 ? parseFloat(((ratings.filter(r => r === rating).length / ratings.length) * 100).toFixed(1)) : 0
        }));

        questionAnalysis.push({
          questionId: question.questionId,
          question: question.questionText,
          type: 'rating',
          avgRating,
          totalResponses: ratings.length,
          distribution
        });
      } else if (question.type === 'multiple_choice') {
        const optionCounts = {};
        (question.options || []).forEach(opt => optionCounts[opt] = 0);

        questionResponses.forEach(r => {
          const selected = r.selectedOption || r.answer;
          if (selected && optionCounts[selected] !== undefined) {
            optionCounts[selected]++;
          }
        });

        const distribution = Object.entries(optionCounts).map(([option, count]) => ({
          option,
          count,
          percentage: questionResponses.length > 0 ? parseFloat(((count / questionResponses.length) * 100).toFixed(1)) : 0
        }));

        questionAnalysis.push({
          questionId: question.questionId,
          question: question.questionText,
          type: 'multiple_choice',
          totalResponses: questionResponses.length,
          distribution
        });
      } else if (question.type === 'text') {
        // For text responses, show aggregated sentiment/themes (no individual responses for privacy)
        questionAnalysis.push({
          questionId: question.questionId,
          question: question.questionText,
          type: 'text',
          totalResponses: questionResponses.filter(r => r.textResponse || r.answer).length,
          // Note: Individual text responses are not shown to faculty for privacy
          aggregatedInfo: 'Text responses are available to department administrators only'
        });
      }
    });

    // Calculate overall metrics
    const ratingQuestions = questionAnalysis.filter(q => q.type === 'rating');
    const overallAvgRating = ratingQuestions.length > 0
      ? parseFloat((ratingQuestions.reduce((sum, q) => sum + q.avgRating, 0) / ratingQuestions.length).toFixed(2))
      : 0;

    // Get section info if filtering by section
    let sectionInfo = null;
    if (section) {
      // Count unique students in filtered responses
      const uniqueStudentIds = [...new Set(filteredResponses.map(r => r.studentId?._id?.toString() || r.studentId?.toString()).filter(Boolean))];
      
      sectionInfo = {
        sectionName: section,
        totalStudents: uniqueStudentIds.length,
        responsesCount: filteredResponses.length
      };
      
      console.log('  Section Info:', sectionInfo);
    }

    console.log('  Question Analysis Count:', questionAnalysis.length);
    console.log('  Overall Average Rating:', overallAvgRating);

    res.json({
      form: {
        _id: form._id,
        title: form.title,
        type: form.type,
        courseName: form.courseName,
        courseCode: form.courseCode,
        targetSections: form.targetSections,
        createdAt: form.createdAt
      },
      sectionFilter: sectionInfo,
      summary: {
        totalResponses: filteredResponses.length,
        overallAvgRating,
        responseRate: sectionInfo ? parseFloat(((filteredResponses.length / sectionInfo.totalStudents) * 100).toFixed(1)) : null
      },
      questionAnalysis,
      // Privacy note
      privacyNote: 'Individual student responses are not visible to maintain privacy. Only aggregated data is shown.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get faculty performance trends (aggregated data only)
// @route   GET /api/department/faculty/:facultyId/trends
// @access  Private (Faculty)
exports.getFacultyPerformanceTrends = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { section, courseName, formType } = req.query;

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Build query for forms
    let query = { facultyId };
    if (courseName) query.courseName = { $regex: new RegExp(courseName, 'i') };
    if (formType) query.type = formType;

    const forms = await FeedbackForm.find(query).sort({ createdAt: 1 });

    const trends = [];

    for (const form of forms) {
      // Get responses for this form
      let responses = await FeedbackResponse.find({ formId: form._id });

      // Filter by section if specified
      if (section) {
        const offering = await CourseOffering.findById(form.courseOfferingId);
        if (offering) {
          const sectionData = offering.sections.find(s => s.sectionName === section);
          if (sectionData) {
            const sectionStudentIds = sectionData.enrolledStudents.map(id => id.toString());
            responses = responses.filter(r =>
              r.studentId && sectionStudentIds.includes(r.studentId.toString())
            );
          }
        }
      }

      // Calculate average rating for this form
      let totalRating = 0;
      let ratingCount = 0;

      responses.forEach(response => {
        response.responses.forEach(ans => {
          if (ans.rating && ans.rating >= 1 && ans.rating <= 5) {
            totalRating += ans.rating;
            ratingCount++;
          } else if (ans.answer && Number.isFinite(Number(ans.answer)) && Number(ans.answer) >= 1 && Number(ans.answer) <= 5) {
            // Fallback to answer field if rating is not set
            totalRating += Number(ans.answer);
            ratingCount++;
          }
        });
      });

      const avgRating = ratingCount > 0 ? parseFloat((totalRating / ratingCount).toFixed(2)) : 0;

      trends.push({
        formId: form._id,
        formTitle: form.title,
        formType: form.type,
        courseName: form.courseName,
        courseCode: form.courseCode,
        targetSections: form.targetSections,
        createdAt: form.createdAt,
        avgRating,
        totalResponses: responses.length,
        // Include section filter info if applied
        filteredSection: section || null
      });
    }

    // Sort by creation date
    trends.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.json({
      faculty: {
        _id: faculty._id,
        name: `${faculty.personalInfo.firstName} ${faculty.personalInfo.lastName}`,
        universityId: faculty.universityId
      },
      filters: {
        section,
        courseName,
        formType
      },
      trends,
      privacyNote: 'Performance trends are based on aggregated student feedback data.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get department admin's analytics (aggregated view of all faculty in their department)
// @route   GET /api/department/analytics
// @access  Private (Department Admin)
exports.getDepartmentAdminAnalytics = async (req, res) => {
  try {
    // Get department from logged-in admin's profile
    const department = req.user.academicInfo?.managedDepartment;
    
    if (!department) {
      return res.status(400).json({ message: 'No department assigned to this admin' });
    }

    console.log('🏢 Loading department admin analytics for:', department);

    // Get all faculty in this department
    const faculty = await User.find({ 
      role: 'faculty', 
      isActive: true,
      'academicInfo.facultyDepartment': department 
    }).select('universityId personalInfo academicInfo');

    console.log(`👥 Found ${faculty.length} faculty members`);

    // Extract unique courses from faculty embedded data
    const courseMap = new Map();
    faculty.forEach(fac => {
      if (fac.academicInfo && fac.academicInfo.courses) {
        fac.academicInfo.courses.forEach(course => {
          if (!courseMap.has(course.courseName)) {
            courseMap.set(course.courseName, {
              courseCode: course.courseCode || 'N/A',
              courseName: course.courseName,
              credits: course.credits || 0,
              department: department
            });
          }
        });
      }
    });

    const uniqueCourses = Array.from(courseMap.values());
    console.log(`📚 Found ${uniqueCourses.length} unique courses from faculty data`);

    // Get all feedback forms for this department's faculty
    const facultyIds = faculty.map(f => f._id);
    const forms = await FeedbackForm.find({ 
      facultyId: { $in: facultyIds }
    });
    const formIds = forms.map(f => f._id);

    console.log(`📋 Found ${forms.length} feedback forms`);

    // Get all responses - IMPORTANT: FeedbackResponse model uses 'formId', not 'feedbackFormId'
    const responses = await FeedbackResponse.find({ formId: { $in: formIds } });

    console.log(`💬 Found ${responses.length} responses`);

    // Calculate metrics
    const totalStudents = await User.countDocuments({ 
      role: 'student', 
      'academicInfo.department': department,
      isActive: true 
    });

    // Calculate average rating
    let totalRating = 0;
    let ratingCount = 0;

    responses.forEach(response => {
      // FeedbackResponse model uses 'responses' array, not 'answers'
      response.responses.forEach(answer => {
        if (answer.type === 'rating' && answer.rating) {
          totalRating += answer.rating;
          ratingCount++;
        }
      });
    });

    const avgSatisfaction = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

    // Faculty performance summary
    const facultyPerformance = faculty.map(f => {
      const facultyForms = forms.filter(form => form.facultyId.toString() === f._id.toString());
      const facultyFormIds = facultyForms.map(form => form._id);
      const facultyResponses = responses.filter(r => 
        facultyFormIds.some(id => id.toString() === r.formId.toString())
      );

      // Calculate average rating for this faculty
      let facTotalRating = 0;
      let facRatingCount = 0;

      facultyResponses.forEach(response => {
        // FeedbackResponse model uses 'responses' array, not 'answers'
        response.responses.forEach(answer => {
          if (answer.type === 'rating' && answer.rating) {
            facTotalRating += answer.rating;
            facRatingCount++;
          }
        });
      });

      const facAvgRating = facRatingCount > 0 ? (facTotalRating / facRatingCount).toFixed(2) : 0;

      // Get unique courses this faculty teaches
      const facultyCourses = f.academicInfo.courses || [];

      return {
        _id: f._id,
        universityId: f.universityId,
        name: `${f.personalInfo.firstName} ${f.personalInfo.lastName}`,
        designation: f.academicInfo.designation,
        courses: facultyCourses,
        totalForms: facultyForms.length,
        totalResponses: facultyResponses.length,
        avgRating: parseFloat(facAvgRating)
      };
    });

    // Course-wise summary - using courseName to match forms
    const courseSummary = uniqueCourses.map(course => {
      // Find forms by courseName (case-insensitive)
      const courseForms = forms.filter(f => 
        f.courseName && f.courseName.toLowerCase() === course.courseName.toLowerCase()
      );
      const courseFormIds = courseForms.map(f => f._id);
      const courseResponses = responses.filter(r => 
        courseFormIds.some(id => id.toString() === r.formId.toString())
      );

      return {
        _id: null, // No MongoDB _id since courses are embedded
        courseCode: course.courseCode,
        courseName: course.courseName,
        credits: course.credits,
        totalForms: courseForms.length,
        totalResponses: courseResponses.length
      };
    });

    console.log('📚 Returning courses:', courseSummary);

    res.json({
      department: {
        name: department,
        admin: {
          name: `${req.user.personalInfo.firstName} ${req.user.personalInfo.lastName}`,
          email: req.user.email
        }
      },
      summary: {
        totalCourses: uniqueCourses.length,
        totalFaculty: faculty.length,
        totalStudents,
        totalFeedbackForms: forms.length,
        totalResponses: responses.length,
        avgSatisfaction: parseFloat(avgSatisfaction),
        responseRate: forms.length > 0 ? 
          parseFloat(((responses.length / (forms.length * 30)) * 100).toFixed(1)) : 0 // Assuming avg 30 students per form
      },
      courses: courseSummary,
      faculty: facultyPerformance
    });
  } catch (error) {
    console.error('Error in getDepartmentAdminAnalytics:', error);
    res.status(500).json({ message: error.message });
  }
};

