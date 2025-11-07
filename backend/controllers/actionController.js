const ActionItem = require('../models/ActionItem');
const DepartmentInsight = require('../models/DepartmentInsight');
const FeedbackResponse = require('../models/FeedbackResponse');
const FeedbackForm = require('../models/FeedbackForm');
const Notification = require('../models/Notification');

// @desc    Create action item
// @route   POST /api/actions
// @access  Private/Faculty/Department
exports.createActionItem = async (req, res) => {
  try {
    const actionItem = await ActionItem.create({
      ...req.body,
      assignedBy: req.user._id
    });

    // Notify assigned user
    await Notification.create({
      userId: req.body.assignedTo,
      title: 'New Action Item Assigned',
      message: `You have been assigned: ${req.body.title}`,
      type: 'action_required',
      priority: req.body.priority,
      relatedEntity: {
        type: 'action_item',
        id: actionItem._id
      }
    });

    res.status(201).json(actionItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get action items
// @route   GET /api/actions
// @access  Private
exports.getActionItems = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.query;
    let query = {};

    // Role-based filtering
    if (req.user.role === 'faculty') {
      query.assignedTo = req.user._id;
    } else if (req.user.role === 'department_admin') {
      // Department admin sees all actions in their department
      query.$or = [
        { assignedBy: req.user._id },
        { assignedTo: req.user._id }
      ];
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    const actions = await ActionItem.find(query)
      .populate('assignedTo', 'personalInfo universityId')
      .populate('assignedBy', 'personalInfo universityId')
      .populate('courseOfferingId')
      .sort({ createdAt: -1 });

    res.json(actions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update action item
// @route   PUT /api/actions/:id
// @access  Private
exports.updateActionItem = async (req, res) => {
  try {
    const actionItem = await ActionItem.findById(req.params.id);

    if (!actionItem) {
      return res.status(404).json({ message: 'Action item not found' });
    }

    // Check authorization
    if (actionItem.assignedTo.toString() !== req.user._id.toString() &&
        actionItem.assignedBy.toString() !== req.user._id.toString() &&
        req.user.role !== 'system_admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(actionItem, req.body);
    
    if (req.body.status === 'completed') {
      actionItem.completedDate = new Date();
    }

    const updatedAction = await actionItem.save();
    res.json(updatedAction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add evidence to action item
// @route   POST /api/actions/:id/evidence
// @access  Private/Faculty
exports.addEvidence = async (req, res) => {
  try {
    const actionItem = await ActionItem.findById(req.params.id);

    if (!actionItem) {
      return res.status(404).json({ message: 'Action item not found' });
    }

    actionItem.evidence.push(req.body);
    await actionItem.save();

    res.json(actionItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get department insights
// @route   GET /api/insights
// @access  Private/Department/Admin
exports.getDepartmentInsights = async (req, res) => {
  try {
    const { department, semester } = req.query;
    let query = {};

    if (req.user.role === 'department_admin') {
      query.department = req.user.academicInfo.managedDepartment;
    } else if (department) {
      query.department = department;
    }

    if (semester) query.semester = semester;

    const insights = await DepartmentInsight.find(query)
      .sort({ generatedAt: -1 });

    // Filter confidential data for faculty
    if (req.user.role === 'faculty') {
      insights.forEach(insight => {
        insight.confidentialData = undefined;
        insight.insights = insight.insights.filter(i => i.visibleToFaculty);
      });
    }

    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate department insights
// @route   POST /api/insights/generate
// @access  Private/Department/Admin
exports.generateInsights = async (req, res) => {
  try {
    const { department, semester } = req.body;

    // Get all feedback for the department and semester
    const forms = await FeedbackForm.find({ status: 'closed' })
      .populate('courseOfferingId');

    const formIds = forms
      .filter(f => {
        // Filter by department and semester
        return true; // Add proper filtering logic
      })
      .map(f => f._id);

    const responses = await FeedbackResponse.find({
      formId: { $in: formIds }
    });

    // Analyze responses and generate insights
    const insights = [];
    const lowPerformingFaculty = [];

    // Group responses by faculty
    const facultyResponses = {};
    
    for (const form of forms) {
      const formResponses = responses.filter(r => r.formId.toString() === form._id.toString());
      
      if (!facultyResponses[form.facultyId]) {
        facultyResponses[form.facultyId] = [];
      }
      
      facultyResponses[form.facultyId].push(...formResponses);
    }

    // Analyze each faculty's performance
    for (const [facultyId, responses] of Object.entries(facultyResponses)) {
      const avgRating = responses.reduce((sum, r) => {
        const ratings = r.responses.filter(res => res.rating).map(res => res.rating);
        const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;
        return sum + avg;
      }, 0) / responses.length;

      if (avgRating < 3.0) {
        lowPerformingFaculty.push({
          facultyId,
          issues: ['Low average rating'],
          supportNeeded: ['Teaching methodology workshop', 'Peer mentoring'],
          visibleToFaculty: false
        });

        insights.push({
          type: 'faculty_performance',
          title: 'Faculty Performance Concern',
          description: `Faculty member has received lower than expected ratings`,
          severity: avgRating < 2.5 ? 'critical' : 'high',
          recommendedActions: ['Schedule one-on-one meeting', 'Provide teaching resources'],
          visibleToFaculty: false
        });
      }
    }

    // Create or update insight document
    const existingInsight = await DepartmentInsight.findOne({ department, semester });
    
    if (existingInsight) {
      existingInsight.insights = insights;
      existingInsight.confidentialData.lowPerformingFaculty = lowPerformingFaculty;
      existingInsight.generatedAt = new Date();
      await existingInsight.save();
      res.json(existingInsight);
    } else {
      const newInsight = await DepartmentInsight.create({
        department,
        semester,
        insights,
        confidentialData: {
          lowPerformingFaculty,
          criticalFeedback: []
        }
      });
      res.status(201).json(newInsight);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ sentAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
