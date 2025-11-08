const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['improvement_action', 'acknowledgment', 'general_announcement'],
    default: 'improvement_action'
  },
  createdBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['faculty', 'department_admin'],
      required: true
    },
    name: String
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  targetSections: [{
    type: String,
    trim: true
  }],
  courseName: String,
  courseCode: String,
  relatedFeedbackForm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedbackForm'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  visibility: {
    students: {
      type: Boolean,
      default: true
    },
    faculty: {
      type: Boolean,
      default: true
    },
    departmentAdmin: {
      type: Boolean,
      default: true
    }
  },
  acknowledgments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
announcementSchema.index({ department: 1, targetSections: 1, status: 1 });
announcementSchema.index({ createdBy: 1, createdAt: -1 });
announcementSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
