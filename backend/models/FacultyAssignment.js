const mongoose = require('mongoose');

const facultyAssignmentSchema = new mongoose.Schema({
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseOfferingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseOffering',
    required: true
  },
  sections: [{
    type: String,
    required: true // ["A", "B", "C"]
  }],
  role: {
    type: String,
    enum: ['primary', 'co-instructor', 'lab_instructor'],
    default: 'primary'
  },
  teachingLoad: {
    type: Number,
    default: 0 // Hours per week
  },
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['active', 'completed', 'on_leave'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
facultyAssignmentSchema.index({ facultyId: 1, status: 1 });
facultyAssignmentSchema.index({ courseOfferingId: 1 });

module.exports = mongoose.model('FacultyAssignment', facultyAssignmentSchema);
