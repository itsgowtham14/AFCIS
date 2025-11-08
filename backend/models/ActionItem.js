const mongoose = require('mongoose');

const actionItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['teaching', 'content', 'assessment', 'facilities'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  source: {
    feedbackResponseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedbackResponse'
    },
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedbackForm'
    },
    isConfidential: {
      type: Boolean,
      default: false
    }
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseOfferingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseOffering'
  },
  visibility: {
    faculty: {
      type: Boolean,
      default: true
    },
    students: {
      type: Boolean,
      default: false
    },
    department: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  dueDate: Date,
  completedDate: Date,
  evidence: [{
    description: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
actionItemSchema.index({ assignedTo: 1, status: 1 });
actionItemSchema.index({ courseOfferingId: 1 });

module.exports = mongoose.model('ActionItem', actionItemSchema);
