const FeedbackForm = require('../models/FeedbackForm');
const FeedbackResponse = require('../models/FeedbackResponse');
const CourseOffering = require('../models/CourseOffering');
const Notification = require('../models/Notification');

// @desc    Create feedback form
// @route   POST /api/feedback/forms
// @access  Private/Faculty
exports.createFeedbackForm = async (req, res) => {
  try {
    // Parse dates properly
    const formData = {
      ...req.body,
      facultyId: req.user._id,
      schedule: {
        ...req.body.schedule,
        openDate: req.body.schedule?.openDate ? new Date(req.body.schedule.openDate) : new Date(),
        closeDate: req.body.schedule?.closeDate ? new Date(req.body.schedule.closeDate) : null
      }
    };

    // Normalize targetSections (uppercase + trimmed) to ensure consistent matching
    if (Array.isArray(formData.targetSections)) {
      formData.targetSections = formData.targetSections
        .map(s => (s == null ? '' : String(s).trim().toUpperCase()))
        .filter(s => s.length > 0);
    } else {
      formData.targetSections = [];
    }

    // Auto-activate if no explicit status provided and open date is now/past
    if (!formData.status) {
      const now = new Date();
      if (formData.schedule.openDate && formData.schedule.openDate <= now) {
        formData.status = 'active';
      }
    }

    const feedbackForm = await FeedbackForm.create(formData);

    // Create notifications for students in target sections
    const courseOffering = await CourseOffering.findById(req.body.courseOfferingId);
    if (courseOffering) {
      const targetSections = courseOffering.sections.filter(s => 
        req.body.targetSections.includes(s.sectionName)
      );

      const studentIds = targetSections.flatMap(s => s.enrolledStudents);

      const notifications = studentIds.map(studentId => ({
        userId: studentId,
        title: 'New Feedback Form Available',
        message: `${req.body.title} is now available`,
        type: 'feedback_reminder',
        relatedEntity: {
          type: 'feedback_form',
          id: feedbackForm._id
        }
      }));

      await Notification.insertMany(notifications);
    }

    res.status(201).json(feedbackForm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all feedback forms
// @route   GET /api/feedback/forms
// @access  Private
exports.getFeedbackForms = async (req, res) => {
  try {
    const { status, courseOfferingId, type } = req.query;
    let query = {};

    // Role-based filtering
    if (req.user.role === 'faculty') {
      query.facultyId = req.user._id;
    } else if (req.user.role === 'student') {
      // Students see only active forms for their enrolled courses
      query.status = 'active';
      // Add logic to filter by student's enrolled courses
    }

    if (status) query.status = status;
    if (courseOfferingId) query.courseOfferingId = courseOfferingId;
    if (type) query.type = type;

    const forms = await FeedbackForm.find(query)
      .populate('facultyId', 'personalInfo universityId')
      .populate('courseOfferingId')
      .sort({ createdAt: -1 });

    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get feedback form by ID
// @route   GET /api/feedback/forms/:id
// @access  Private
exports.getFeedbackFormById = async (req, res) => {
  try {
    const form = await FeedbackForm.findById(req.params.id)
      .populate('facultyId', 'personalInfo universityId')
      .populate('courseOfferingId');

    if (!form) {
      return res.status(404).json({ message: 'Feedback form not found' });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update feedback form
// @route   PUT /api/feedback/forms/:id
// @access  Private/Faculty & Department Admin
exports.updateFeedbackForm = async (req, res) => {
  try {
    const form = await FeedbackForm.findById(req.params.id);

    if (!form) {
      return res.status(404).json({ message: 'Feedback form not found' });
    }

    // Check ownership - faculty can only edit their own forms, department admins and system admins can edit all forms
    if (req.user.role === 'faculty' && form.facultyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this form' });
    }
    if (!['faculty', 'department_admin', 'system_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(form, req.body);
    const updatedForm = await form.save();

    res.json(updatedForm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete feedback form
// @route   DELETE /api/feedback/forms/:id
// @access  Private/Faculty & Department Admin
exports.deleteFeedbackForm = async (req, res) => {
  try {
    const form = await FeedbackForm.findById(req.params.id);

    if (!form) {
      return res.status(404).json({ message: 'Feedback form not found' });
    }

    // Check ownership - faculty can only delete their own forms, department admins and system admins can delete all forms
    if (req.user.role === 'faculty' && form.facultyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this form' });
    }
    if (!['faculty', 'department_admin', 'system_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await form.deleteOne();
    res.json({ message: 'Feedback form deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active feedback forms for student
// @route   GET /api/feedback/active
// @access  Private/Student
exports.getActiveFeedbackForStudent = async (req, res) => {
  try {
    console.log('=== GET ACTIVE FEEDBACK FOR STUDENT ===');
    console.log('Student ID:', req.user._id);
    console.log('Student Section:', req.user.academicInfo?.section);
    console.log('Student Full Academic Info:', JSON.stringify(req.user.academicInfo, null, 2));

    // Get student's section from academicInfo
    let studentSection = req.user.academicInfo?.section;

    if (!studentSection) {
      console.log('No section found for student');
      return res.json([]);
    }

    // Normalize the student's section value (trim, uppercase)
    studentSection = String(studentSection).trim().toUpperCase();

    const currentDate = new Date();
    console.log('Current Date:', currentDate);

    // Build section variants to tolerate minor format differences
    const sectionVariants = new Set();
    sectionVariants.add(studentSection);

    // If section is like 'A' allow '1A', '01A', etc. If it starts with digit, also allow stripped version
    if (!/^[0-9]/.test(studentSection)) {
      sectionVariants.add('1' + studentSection);
      sectionVariants.add('01' + studentSection);
    } else {
      // starts with digits like '1A' -> add stripped 'A'
      const stripped = studentSection.replace(/^0+/, '').replace(/^[0-9]+/, '');
      if (stripped) sectionVariants.add(stripped);
    }

    // Also add upper-case and lower-case variants for safe matching
    Array.from(Array.from(sectionVariants)).forEach(v => {
      const s = String(v);
      sectionVariants.add(s.toUpperCase());
      sectionVariants.add(s.toLowerCase());
    });

    console.log('Section variants used for matching:', Array.from(sectionVariants));

    // Primary query: exact/variant match
    let forms = await FeedbackForm.find({
      status: 'active',
      targetSections: { $in: Array.from(sectionVariants) },
      'schedule.openDate': { $lte: currentDate },
      $or: [
        { 'schedule.closeDate': { $exists: false } },
        { 'schedule.closeDate': null },
        { 'schedule.closeDate': { $gte: currentDate } }
      ]
    })
      .populate('facultyId', 'personalInfo.firstName personalInfo.lastName isActive academicInfo.facultyDepartment')
      .sort({ createdAt: -1 });

    console.log('Found forms matching section (direct variants):', forms.length);
    forms.forEach(f => {
      console.log(`  Direct match: ${f.title} - targetSections: ${JSON.stringify(f.targetSections)}`);
    });

    // If none found, broaden search: fetch all active forms by date range and apply robust normalization matching in-memory
    if (forms.length === 0) {
      console.log('No direct variant matches. Running broad fallback matching...');
      const broadForms = await FeedbackForm.find({
        status: 'active',
        'schedule.openDate': { $lte: currentDate },
        $or: [
          { 'schedule.closeDate': { $exists: false } },
          { 'schedule.closeDate': null },
          { 'schedule.closeDate': { $gte: currentDate } }
        ]
      }).populate('facultyId', 'personalInfo.firstName personalInfo.lastName isActive academicInfo.facultyDepartment');

      console.log('Total broad forms found:', broadForms.length);
      broadForms.forEach(f => {
        console.log(`  Broad form: ${f.title} - targetSections: ${JSON.stringify(f.targetSections)}`);
      });

      // Normalization helper (strip prefixes, spaces, hyphens, leading zeros)
      const normalize = (s) => {
        if (!s) return '';
        return String(s)
          .toUpperCase()
          .trim()
          .replace(/^SECTION[\s:-]*/,'')
          .replace(/^SEC[\s:-]*/,'')
          .replace(/^S[\s:-]*/,'')
          .replace(/\s+/g,'')
          .replace(/-/g,'')
          .replace(/^0+/,'');
      };
      const normalizedStudent = normalize(studentSection);

      console.log('Normalized student section:', normalizedStudent);

      const broadened = broadForms.filter(f => {
        const anyMatch = (f.targetSections || []).some(ts => {
          const normTs = normalize(ts);
          console.log(`  Comparing normalized target "${normTs}" with student "${normalizedStudent}"`);
          if (normTs === normalizedStudent) return true;
          // Handle patterns like '1A' vs 'A' (strip leading digits)
          const strippedDigits = normTs.replace(/^[0-9]+/, '');
          console.log(`  Stripped digits comparison: "${strippedDigits}" vs "${normalizedStudent}"`);
          return strippedDigits === normalizedStudent;
        });
        return anyMatch;
      });

      console.log(`Broad fallback candidate forms: ${broadened.length}`);
      broadened.forEach(f => {
        console.log(`  * ${f.title} sections=${JSON.stringify(f.targetSections)} (matched via normalization)`);
      });

      forms = broadened; // Replace with broadened result
    }    // Filter out orphaned forms (faculty deleted) or inactive faculty
    const validForms = forms.filter(f => {
      const hasFaculty = !!f.facultyId; // populated doc exists
      const isActiveFaculty = hasFaculty ? (f.facultyId.isActive !== false) : false;
      return hasFaculty && isActiveFaculty;
    });

    if (validForms.length !== forms.length) {
      console.log(`Filtered out ${forms.length - validForms.length} forms due to missing or inactive faculty`);
    }

    if (validForms.length > 0) {
      validForms.forEach(f => {
        console.log(`  - ${f.title} (${f.courseName}) - Sections: ${Array.isArray(f.targetSections) ? f.targetSections.join(',') : ''}`);
        console.log(`    Status: ${f.status}, Open: ${f.schedule?.openDate}, Close: ${f.schedule?.closeDate}`);
      });
    } else {
      console.log('No valid forms after faculty filtering.');
    }

    // Check which forms have been submitted
    const formIds = validForms.map(f => f._id);
    const responses = await FeedbackResponse.find({
      formId: { $in: formIds },
      studentId: req.user._id
    });

    const submittedFormIds = responses.map(r => r.formId.toString());
    console.log('Already submitted:', submittedFormIds.length);

    const formsWithStatus = validForms.map(form => ({
      ...form.toObject(),
      submitted: submittedFormIds.includes(form._id.toString())
    }));

    res.json(formsWithStatus);
  } catch (error) {
    console.error('Error in getActiveFeedbackForStudent:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit feedback response
// @route   POST /api/feedback/responses
// @access  Private/Student
exports.submitFeedbackResponse = async (req, res) => {
  try {
    const { formId, responses = [], timeSpent } = req.body;

    if (!formId) {
      return res.status(400).json({ message: 'Form ID is required' });
    }

    // Check if already submitted
    const existingResponse = await FeedbackResponse.findOne({
      formId,
      studentId: req.user._id
    });

    if (existingResponse) {
      return res.status(400).json({ message: 'You have already submitted this feedback' });
    }

    // Get form to check settings
    const form = await FeedbackForm.findById(formId);
    if (!form) {
      return res.status(404).json({ message: 'Feedback form not found' });
    }

    if (form.status !== 'active') {
      return res.status(400).json({ message: 'This feedback form is not active' });
    }

    // Build lookup map for incoming responses (supporting multiple formats)
    const responseLookup = new Map();
    responses.forEach((resp, idx) => {
      if (!resp) return;
      const normalized = { ...resp, originalIndex: idx };

      if (resp.questionId) {
        try {
          const key = resp.questionId.toString();
          responseLookup.set(key, normalized);
        } catch (error) {
          // ignore invalid ids
        }
      }

      if (resp.question?.id) {
        responseLookup.set(String(resp.question.id), normalized);
      }

      // Fallback: index-based key for legacy payloads
      responseLookup.set(String(idx), normalized);
    });

    const formattedResponses = [];
    const submissionTimestamp = new Date();

    form.questions.forEach((question, index) => {
      const questionId = (question.questionId || question._id)?.toString();
      const possibleKeys = [
        questionId,
        question._id ? question._id.toString() : null,
        String(index)
      ].filter(Boolean);

      const incoming = possibleKeys.reduce((found, key) => {
        if (found) return found;
        return responseLookup.get(key) || null;
      }, null);

      let ratingValue;
      let textValue;
      let optionValue;
      let genericAnswer = null;

      const coerceNumber = (value) => {
        if (value === null || value === undefined || value === '') return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      };

      switch (question.type) {
        case 'rating': {
          const raw = incoming?.rating ?? incoming?.answer ?? incoming?.value ?? incoming?.score;
          const parsed = coerceNumber(raw);
          if (parsed !== null) {
            ratingValue = Math.min(5, Math.max(1, Math.round(parsed)));
            genericAnswer = ratingValue;
          }

          if (question.required && (ratingValue === null || ratingValue === undefined)) {
            throw new Error(`Rating required for question "${question.questionText}"`);
          }
          break;
        }
        case 'multiple_choice': {
          const raw = incoming?.selectedOption ?? incoming?.answer ?? incoming?.value;
          if (raw !== undefined && raw !== null) {
            optionValue = String(raw);
            if (Array.isArray(question.options) && question.options.length > 0) {
              if (!question.options.includes(optionValue)) {
                throw new Error(`Invalid option selected for question "${question.questionText}"`);
              }
            }
            genericAnswer = optionValue;
          }

          if (question.required && !optionValue) {
            throw new Error(`An option must be selected for question "${question.questionText}"`);
          }
          break;
        }
        default: {
          const raw = incoming?.textResponse ?? incoming?.answer ?? incoming?.value ?? '';
          const text = typeof raw === 'string' ? raw.trim() : raw;
          textValue = text;
          genericAnswer = text;

          if (question.required && (!textValue || textValue.length === 0)) {
            throw new Error(`Response required for question "${question.questionText}"`);
          }
        }
      }

      const responsePayload = {
        questionId: question.questionId || question._id,
        questionText: question.questionText,
        type: question.type,
        answer: genericAnswer
      };

      if (ratingValue !== undefined) {
        responsePayload.rating = ratingValue;
      }

      if (textValue !== undefined) {
        responsePayload.textResponse = textValue;
      }

      if (optionValue !== undefined) {
        responsePayload.selectedOption = optionValue;
      }

      formattedResponses.push(responsePayload);
    });

    const feedbackResponse = await FeedbackResponse.create({
      formId,
      studentId: req.user._id,
      isAnonymous: form.settings.isAnonymous,
      responses: formattedResponses,
      submittedAt: submissionTimestamp,
      metadata: {
        submissionDate: submissionTimestamp,
        timeSpent,
        device: req.headers['user-agent']
      }
    });

    // Update form response count
    form.responseCount += 1;
    await form.save();

    // Notify faculty if configured
    if (form.settings.showToFaculty) {
      await Notification.create({
        userId: form.facultyId,
        title: 'New Feedback Response',
        message: `A student has submitted feedback for ${form.title}`,
        type: 'response_received',
        relatedEntity: {
          type: 'feedback_form',
          id: formId
        }
      });
    }

    res.status(201).json(feedbackResponse);
  } catch (error) {
    if (error.message && error.message.includes('question')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student's feedback history (submitted responses)
// @route   GET /api/feedback/my-history
// @access  Private/Student
exports.getStudentFeedbackHistory = async (req, res) => {
  try {
    console.log('=== GET STUDENT FEEDBACK HISTORY ===');
    console.log('Student ID:', req.user._id);

    // Get all responses submitted by this student
    const responses = await FeedbackResponse.find({ studentId: req.user._id })
      .populate({
        path: 'formId',
        select: 'title courseName courseCode type schedule createdAt'
      })
      .sort({ submittedAt: -1 });

    console.log('Found responses:', responses.length);

    // Format the response to include form details and student's answers
    const history = responses.map((resp) => {
      const normalizedResponses = (resp.responses || []).map((item) => ({
        questionId: item.questionId,
        questionText: item.questionText,
        type: item.type,
        rating: item.rating,
        textResponse: item.textResponse,
        selectedOption: item.selectedOption,
        answer: item.answer ?? (item.type === 'rating'
          ? item.rating
          : item.type === 'multiple_choice'
            ? item.selectedOption
            : item.textResponse)
      }));

      const ratingOnly = normalizedResponses.filter((r) => r.type === 'rating' && r.rating !== undefined && r.rating !== null);
      const averageRating = ratingOnly.length
        ? ratingOnly.reduce((sum, r) => sum + Number(r.rating || 0), 0) / ratingOnly.length
        : null;

      return {
        _id: resp._id,
        formId: resp.formId._id,
        title: resp.formId.title,
        courseName: resp.formId.courseName,
        courseCode: resp.formId.courseCode,
        type: resp.formId.type,
        submittedAt: resp.submittedAt || resp.metadata?.submissionDate,
        responses: normalizedResponses,
        averageRating
      };
    });

    res.json(history);
  } catch (error) {
    console.error('Error in getStudentFeedbackHistory:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get responses for a feedback form
// @route   GET /api/feedback/forms/:id/responses
// @access  Private/Faculty
exports.getFeedbackResponses = async (req, res) => {
  try {
    const form = await FeedbackForm.findById(req.params.id);

    if (!form) {
      return res.status(404).json({ message: 'Feedback form not found' });
    }

    // Check authorization
    if (form.facultyId.toString() !== req.user._id.toString() && 
        req.user.role !== 'department_admin' && 
        req.user.role !== 'system_admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let responses = await FeedbackResponse.find({ formId: req.params.id })
      .populate('studentId', 'personalInfo academicInfo');

    // Filter based on visibility and anonymity
    if (req.user.role === 'faculty' && !form.settings.showToFaculty) {
      return res.status(403).json({ message: 'Responses are not visible to faculty yet' });
    }

    // Anonymize if required
    if (form.settings.isAnonymous && req.user.role === 'faculty') {
      responses = responses.map(r => ({
        ...r.toObject(),
        studentId: null,
        isAnonymous: true
      }));
    } else {
      responses = responses.map(r => r.toObject());
    }

    const normalized = responses.map((resp) => ({
      ...resp,
      submittedAt: resp.submittedAt || resp.metadata?.submissionDate || resp.createdAt,
      responses: (resp.responses || []).map((item) => ({
        ...item,
        answer: item.answer ?? (item.type === 'rating'
          ? item.rating
          : item.type === 'multiple_choice'
            ? item.selectedOption
            : item.textResponse)
      }))
    }));

    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get feedback analytics
// @route   GET /api/feedback/forms/:id/analytics
// @access  Private/Faculty
exports.getFeedbackAnalytics = async (req, res) => {
  try {
    const form = await FeedbackForm.findById(req.params.id);

    if (!form) {
      return res.status(404).json({ message: 'Feedback form not found' });
    }

    const responses = await FeedbackResponse.find({ formId: req.params.id });

    // Calculate analytics
    const analytics = {
      totalResponses: responses.length,
      responseRate: 0, // Calculate based on enrolled students
      questionAnalytics: []
    };

    // Get enrolled students count
    const courseOffering = await CourseOffering.findById(form.courseOfferingId);
    if (courseOffering) {
      const targetSections = courseOffering.sections.filter(s => 
        form.targetSections.includes(s.sectionName)
      );
      const totalStudents = targetSections.reduce((sum, s) => sum + s.enrolledStudents.length, 0);
      analytics.responseRate = totalStudents > 0 ? (responses.length / totalStudents * 100).toFixed(2) : 0;
    }

    // Analyze each question
    form.questions.forEach(question => {
      const questionKey = (question.questionId || question._id)?.toString();
      const questionResponses = responses
        .map(r => {
          const entries = Array.isArray(r.responses) ? r.responses : [];
          return entries.find(res => res.questionId && res.questionId.toString() === questionKey);
        })
        .filter(Boolean);

      if (question.type === 'rating') {
        const ratings = questionResponses
          .map(r => {
            const val = r.rating ?? (r.type === 'rating' ? r.answer : undefined);
            const num = Number(val);
            return Number.isFinite(num) ? num : null;
          })
          .filter(value => Number.isFinite(value));
        const avg = ratings.length > 0 
          ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2) 
          : 0;

        analytics.questionAnalytics.push({
          questionId: question.questionId,
          questionText: question.questionText,
          type: 'rating',
          average: parseFloat(avg),
          distribution: {
            1: ratings.filter(r => r === 1).length,
            2: ratings.filter(r => r === 2).length,
            3: ratings.filter(r => r === 3).length,
            4: ratings.filter(r => r === 4).length,
            5: ratings.filter(r => r === 5).length
          },
          totalResponses: ratings.length
        });
      } else if (question.type === 'text') {
        analytics.questionAnalytics.push({
          questionId: question.questionId,
          questionText: question.questionText,
          type: 'text',
          responses: questionResponses.map(r => r.textResponse ?? (r.type === 'text' ? r.answer : undefined)).filter(Boolean),
          totalResponses: questionResponses.length
        });
      }
    });

    const ratingAnalytics = analytics.questionAnalytics.filter(q => q.type === 'rating');
    if (ratingAnalytics.length) {
      const aggregate = ratingAnalytics.reduce((sum, item) => sum + Number(item.average || 0), 0) / ratingAnalytics.length;
      analytics.averageRating = parseFloat(aggregate.toFixed(2));
    } else {
      analytics.averageRating = null;
    }

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get department analytics - course performance overview
// @route   GET /api/feedback/department/analytics
// @access  Private/Department Admin
exports.getDepartmentAnalytics = async (req, res) => {
  try {
    const User = require('../models/User');
    const Course = require('../models/Course');
    
    console.log('🔍 Fetching courses from faculty data...');
    
    // Get all faculty users and extract their courses
    const faculty = await User.find({ role: 'faculty' });
    console.log(`👨‍🏫 Found ${faculty.length} faculty members`);
    
    // Extract all unique courses from faculty data
    const coursesMap = new Map();
    
    faculty.forEach(fac => {
      const facultyCourses = fac.academicInfo?.courses || [];
      facultyCourses.forEach(course => {
        if (course.courseName) {
          const key = course.courseName.toLowerCase().trim();
          if (!coursesMap.has(key)) {
            coursesMap.set(key, {
              courseName: course.courseName,
              courseCode: course.courseCode || 'N/A',
              faculty: []
            });
          }
          // Add faculty to this course
          coursesMap.get(key).faculty.push({
            id: fac._id,
            name: `${fac.personalInfo?.firstName || ''} ${fac.personalInfo?.lastName || ''}`.trim(),
            universityId: fac.universityId,
            sections: course.sections || []
          });
        }
      });
    });
    
    const uniqueCourses = Array.from(coursesMap.values());
    console.log(`📚 Found ${uniqueCourses.length} unique courses from faculty data`);
    
    if (uniqueCourses.length === 0) {
      return res.json({
        department: 'All Departments',
        courses: [],
        totalCourses: 0,
        totalResponses: 0,
        message: 'No courses found in faculty data. Please upload faculty data first.'
      });
    }

    // Now get feedback data for these courses
    const courseAnalytics = [];

    for (const course of uniqueCourses) {
      // Find feedback forms that match this course name
      const courseForms = await FeedbackForm.find({
        courseName: { $regex: new RegExp(course.courseName, 'i') }
      }).populate('facultyId', 'personalInfo universityId');

      const formIds = courseForms.map(f => f._id);
      
      // Get responses for these forms
      const responses = await FeedbackResponse.find({
        formId: { $in: formIds }
      });

      // Calculate average rating across all questions
      let totalRatings = [];
      responses.forEach(response => {
        response.responses.forEach(ans => {
          if (ans.rating) {
            totalRatings.push(ans.rating);
          } else if (ans.answer && Number.isFinite(Number(ans.answer)) && Number(ans.answer) >= 1 && Number(ans.answer) <= 5) {
            // Fallback to answer field
            totalRatings.push(Number(ans.answer));
          }
        });
      });

      const avgRating = totalRatings.length > 0
        ? (totalRatings.reduce((a, b) => a + b, 0) / totalRatings.length).toFixed(2)
        : 0;

      courseAnalytics.push({
        courseId: course.courseName, // Use course name as ID since we don't have Course collection
        courseCode: course.courseCode,
        courseName: course.courseName,
        credits: 3, // Default value
        totalFeedbackForms: courseForms.length,
        totalResponses: responses.length,
        averageRating: parseFloat(avgRating),
        facultyCount: course.faculty.length,
        faculty: course.faculty
      });
    }

    const totalResponses = courseAnalytics.reduce((sum, c) => sum + c.totalResponses, 0);

    res.json({
      department: 'All Departments',
      totalCourses: uniqueCourses.length,
      totalResponses: totalResponses,
      courses: courseAnalytics
    });
  } catch (error) {
    console.error('❌ Department analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get course-specific analytics with faculty breakdown
// @route   GET /api/feedback/department/courses/:courseId/analytics
// @access  Private/Department Admin
exports.getCourseAnalytics = async (req, res) => {
  try {
    const User = require('../models/User');
    
    // courseId is actually courseName from faculty data
    const courseName = decodeURIComponent(req.params.courseId);
    console.log(`🔍 Fetching analytics for course: ${courseName}`);
    
    // Get all faculty teaching this course
    const faculty = await User.find({ 
      role: 'faculty',
      'academicInfo.courses.courseName': { $regex: new RegExp(courseName, 'i') }
    });

    if (faculty.length === 0) {
      return res.status(404).json({ message: 'No faculty found for this course' });
    }

    // Extract course info from faculty data
    let courseInfo = null;
    for (const fac of faculty) {
      const course = fac.academicInfo?.courses?.find(c => 
        c.courseName.toLowerCase() === courseName.toLowerCase()
      );
      if (course) {
        courseInfo = course;
        break;
      }
    }

    // Get feedback forms for this course
    const feedbackForms = await FeedbackForm.find({
      courseName: { $regex: new RegExp(courseName, 'i') }
    }).populate('facultyId', 'personalInfo universityId academicInfo');

    const formIds = feedbackForms.map(f => f._id);

    // Get responses
    const responses = await FeedbackResponse.find({
      formId: { $in: formIds }
    });

    // Calculate overall course analytics
    let allRatings = [];
    responses.forEach(response => {
      response.responses.forEach(ans => {
        if (ans.rating) allRatings.push(ans.rating);
        else if (ans.answer && Number.isFinite(Number(ans.answer)) && Number(ans.answer) >= 1 && Number(ans.answer) <= 5) {
          allRatings.push(Number(ans.answer));
        }
      });
    });

    const avgRating = allRatings.length > 0
      ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(2)
      : 0;

    const ratingDistribution = {
      1: allRatings.filter(r => r === 1).length,
      2: allRatings.filter(r => r === 2).length,
      3: allRatings.filter(r => r === 3).length,
      4: allRatings.filter(r => r === 4).length,
      5: allRatings.filter(r => r === 5).length
    };

    // Group by faculty - Initialize with ALL faculty teaching this course
    const facultyAnalytics = [];
    const facultyMap = new Map();

    // First, add all faculty teaching this course (from faculty data)
    faculty.forEach(fac => {
      const facultyCourse = fac.academicInfo?.courses?.find(c => 
        c.courseName.toLowerCase() === courseName.toLowerCase()
      );
      
      if (facultyCourse) {
        const facultyId = fac._id.toString();
        facultyMap.set(facultyId, {
          facultyId: facultyId,
          name: `${fac.personalInfo?.firstName || ''} ${fac.personalInfo?.lastName || ''}`.trim(),
          universityId: fac.universityId,
          designation: fac.academicInfo?.designation || '',
          sections: facultyCourse.sections || [],
          forms: [],
          responses: []
        });
      }
    });

    // Then associate feedback forms with faculty
    feedbackForms.forEach(form => {
      if (!form.facultyId) return;
      
      const facultyId = form.facultyId._id.toString();
      
      if (facultyMap.has(facultyId)) {
        const facultyData = facultyMap.get(facultyId);
        facultyData.forms.push(form);
      }
    });

    // Calculate analytics for each faculty
    for (const [facultyId, facultyData] of facultyMap) {
      const facultyFormIds = facultyData.forms.map(f => f._id.toString());
      const facultyResponses = responses.filter(r => 
        facultyFormIds.includes(r.formId.toString())
      );

      facultyData.responses = facultyResponses;

      // Calculate ratings
      let facultyRatings = [];
      facultyResponses.forEach(response => {
        response.responses.forEach(ans => {
          if (ans.rating) facultyRatings.push(ans.rating);
          else if (ans.answer && Number.isFinite(Number(ans.answer)) && Number(ans.answer) >= 1 && Number(ans.answer) <= 5) {
            facultyRatings.push(Number(ans.answer));
          }
        });
      });

      const facultyAvgRating = facultyRatings.length > 0
        ? (facultyRatings.reduce((a, b) => a + b, 0) / facultyRatings.length).toFixed(2)
        : 0;

      facultyAnalytics.push({
        facultyId: facultyData.facultyId,
        name: facultyData.name,
        universityId: facultyData.universityId,
        designation: facultyData.designation,
        sections: facultyData.sections,
        totalForms: facultyData.forms.length,
        totalResponses: facultyResponses.length,
        averageRating: parseFloat(facultyAvgRating),
        ratingDistribution: {
          1: facultyRatings.filter(r => r === 1).length,
          2: facultyRatings.filter(r => r === 2).length,
          3: facultyRatings.filter(r => r === 3).length,
          4: facultyRatings.filter(r => r === 4).length,
          5: facultyRatings.filter(r => r === 5).length
        }
      });
    }

    res.json({
      course: {
        code: courseInfo?.courseCode || 'N/A',
        name: courseName,
        credits: 3 // Default value
      },
      overall: {
        totalForms: feedbackForms.length,
        totalResponses: responses.length,
        averageRating: parseFloat(avgRating),
        ratingDistribution
      },
      faculty: facultyAnalytics
    });
  } catch (error) {
    console.error('Course analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get faculty-specific analytics with section breakdown
// @route   GET /api/feedback/department/faculty/:facultyId/analytics
// @access  Private/Department Admin
exports.getFacultyAnalytics = async (req, res) => {
  try {
    const User = require('../models/User');
    
    const faculty = await User.findById(req.params.facultyId);
    
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const { courseId } = req.query; // This is actually courseName now
    const courseName = courseId ? decodeURIComponent(courseId) : null;

    console.log(`🔍 Fetching analytics for faculty: ${faculty.personalInfo?.firstName} ${faculty.personalInfo?.lastName}`);
    if (courseName) {
      console.log(`📚 Filtering by course: ${courseName}`);
    }

    // Get the course and sections from faculty's data
    let facultyCourses = faculty.academicInfo?.courses || [];
    if (courseName) {
      facultyCourses = facultyCourses.filter(c => 
        c.courseName.toLowerCase() === courseName.toLowerCase()
      );
    }

    // Build query for feedback forms
    let query = { facultyId: faculty._id };
    if (courseName) {
      query.courseName = { $regex: new RegExp(courseName, 'i') };
    }

    // Get feedback forms
    const feedbackForms = await FeedbackForm.find(query);

    const formIds = feedbackForms.map(f => f._id);

    // Get responses
    const responses = await FeedbackResponse.find({
      formId: { $in: formIds }
    }).populate('studentId', 'universityId personalInfo.firstName personalInfo.lastName');

    // Group by section - use sections from faculty's course data
    const sectionAnalytics = [];
    const sectionMap = new Map();

    // Initialize sections from faculty's course data
    facultyCourses.forEach(course => {
      course.sections.forEach(section => {
        if (!sectionMap.has(section)) {
          sectionMap.set(section, {
            section: section,
            courseName: course.courseName,
            courseCode: course.courseCode,
            forms: [],
            responses: []
          });
        }
      });
    });

    // Associate feedback forms with sections
    feedbackForms.forEach(form => {
      form.targetSections.forEach(section => {
        if (sectionMap.has(section)) {
          sectionMap.get(section).forms.push(form);
        } else {
          // Add section if not in faculty data but has forms
          sectionMap.set(section, {
            section: section,
            courseName: form.courseName || 'N/A',
            courseCode: 'N/A',
            forms: [form],
            responses: []
          });
        }
      });
    });

    // Calculate analytics for each section
    for (const [section, data] of sectionMap) {
      const sectionFormIds = data.forms.map(f => f._id.toString());
      const sectionResponses = responses.filter(r =>
        sectionFormIds.includes(r.formId.toString())
      );

      data.responses = sectionResponses;

      // Calculate ratings
      let sectionRatings = [];
      sectionResponses.forEach(response => {
        response.responses.forEach(ans => {
          if (ans.rating) sectionRatings.push(ans.rating);
          else if (ans.answer && Number.isFinite(Number(ans.answer)) && Number(ans.answer) >= 1 && Number(ans.answer) <= 5) {
            sectionRatings.push(Number(ans.answer));
          }
        });
      });

      const sectionAvgRating = sectionRatings.length > 0
        ? (sectionRatings.reduce((a, b) => a + b, 0) / sectionRatings.length).toFixed(2)
        : 0;

      sectionAnalytics.push({
        section: section,
        courseName: data.courseName,
        courseCode: data.courseCode,
        totalForms: data.forms.length,
        totalResponses: sectionResponses.length,
        averageRating: parseFloat(sectionAvgRating),
        ratingDistribution: {
          1: sectionRatings.filter(r => r === 1).length,
          2: sectionRatings.filter(r => r === 2).length,
          3: sectionRatings.filter(r => r === 3).length,
          4: sectionRatings.filter(r => r === 4).length,
          5: sectionRatings.filter(r => r === 5).length
        },
        feedbackForms: data.forms.map(f => ({
          id: f._id,
          title: f.title,
          type: f.type,
          status: f.status,
          responseCount: sectionResponses.filter(r => r.formId.toString() === f._id.toString()).length,
          // Include individual responses for department admins
          responses: sectionResponses
            .filter(r => r.formId.toString() === f._id.toString())
            .map(r => ({
              studentId: r.studentId?.universityId || 'Unknown',
              studentName: r.studentId ? `${r.studentId.personalInfo?.firstName || ''} ${r.studentId.personalInfo?.lastName || ''}`.trim() : 'Unknown',
              submittedAt: r.submittedAt || r.metadata?.submissionDate,
              responses: r.responses.map(ans => ({
                questionId: ans.questionId,
                questionText: ans.questionText,
                type: ans.type,
                rating: ans.rating,
                textResponse: ans.textResponse,
                selectedOption: ans.selectedOption,
                answer: ans.answer
              }))
            }))
        }))
      });
    }

    // Calculate overall stats
    let allRatings = [];
    responses.forEach(response => {
      response.responses.forEach(ans => {
        if (ans.rating) allRatings.push(ans.rating);
        else if (ans.answer && Number.isFinite(Number(ans.answer)) && Number(ans.answer) >= 1 && Number(ans.answer) <= 5) {
          allRatings.push(Number(ans.answer));
        }
      });
    });

    const avgRating = allRatings.length > 0
      ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(2)
      : 0;

    res.json({
      faculty: {
        id: faculty._id,
        name: `${faculty.personalInfo.firstName} ${faculty.personalInfo.lastName}`,
        universityId: faculty.universityId,
        designation: faculty.academicInfo?.designation || '',
        department: faculty.academicInfo?.facultyDepartment || ''
      },
      overall: {
        totalForms: feedbackForms.length,
        totalResponses: responses.length,
        averageRating: parseFloat(avgRating),
        sectionsCount: sectionAnalytics.length
      },
      sections: sectionAnalytics
    });
  } catch (error) {
    console.error('Faculty analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};
