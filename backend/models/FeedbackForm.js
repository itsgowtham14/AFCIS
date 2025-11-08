const mongoose = require('mongoose');

const feedbackFormSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['lecture', 'unit', 'module', 'semester', 'module_bank'],
    required: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  // New fields for course info (instead of courseOfferingId)
  courseName: {
    type: String,
    required: true
  },
  courseCode: {
    type: String
  },
  courseOfferingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseOffering',
    required: false // Made optional since we're using courseName
  },
  targetSections: [{
    type: String,
    required: true // ["A", "B", "1A", "1B"]
  }],
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    questionText: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['rating', 'text', 'multiple_choice'],
      default: 'rating'
    },
    options: [String],
    required: {
      type: Boolean,
      default: true
    }
  }],
  settings: {
    isAnonymous: {
      type: Boolean,
      default: true
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    showToFaculty: {
      type: Boolean,
      default: false
    },
    autoClose: {
      type: Boolean,
      default: true
    },
    closeDate: Date
  },
  schedule: {
    openDate: {
      type: Date,
      default: Date.now
    },
    closeDate: Date,
    reminderFrequency: {
      type: String,
      enum: ['none', 'daily', 'weekly'],
      default: 'weekly'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'archived'],
    default: 'draft'
  },
  responseCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
feedbackFormSchema.index({ facultyId: 1, status: 1 });
feedbackFormSchema.index({ courseOfferingId: 1 });
feedbackFormSchema.index({ status: 1, 'schedule.closeDate': 1 });

module.exports = mongoose.model('FeedbackForm', feedbackFormSchema);
