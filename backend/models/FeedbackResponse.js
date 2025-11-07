const mongoose = require('mongoose');

const feedbackResponseSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedbackForm',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  visibility: {
    faculty: {
      type: Boolean,
      default: true
    },
    department: {
      type: Boolean,
      default: true
    },
    admin: {
      type: Boolean,
      default: true
    }
  },
  responses: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    questionText: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['rating', 'text', 'multiple_choice'],
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    textResponse: String,
    selectedOption: String,
    answer: mongoose.Schema.Types.Mixed
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    submissionDate: {
      type: Date,
      default: Date.now
    },
    timeSpent: Number, // seconds
    device: String,
    ipAddress: String
  },
  analytics: {
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral']
    },
    topics: [String],
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    }
  }
});

// Compound index to prevent duplicate submissions
feedbackResponseSchema.index({ formId: 1, studentId: 1 }, { unique: true });
feedbackResponseSchema.index({ formId: 1 });

module.exports = mongoose.model('FeedbackResponse', feedbackResponseSchema);
