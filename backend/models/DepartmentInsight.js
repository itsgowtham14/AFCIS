const mongoose = require('mongoose');

const departmentInsightSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    required: true
  },
  insights: [{
    type: {
      type: String,
      enum: ['faculty_performance', 'course_issues', 'curriculum_gaps', 'student_satisfaction'],
      required: true
    },
    title: String,
    description: String,
    source: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedbackResponse'
    }],
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    recommendedActions: [String],
    visibleToFaculty: {
      type: Boolean,
      default: false
    }
  }],
  confidentialData: {
    lowPerformingFaculty: [{
      facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      issues: [String],
      supportNeeded: [String],
      visibleToFaculty: {
        type: Boolean,
        default: false
      }
    }],
    criticalFeedback: [{
      feedbackResponseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeedbackResponse'
      },
      issue: String,
      actionTaken: String
    }]
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
departmentInsightSchema.index({ department: 1, semester: 1 });

module.exports = mongoose.model('DepartmentInsight', departmentInsightSchema);
