const mongoose = require('mongoose');

const courseOfferingSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  semester: {
    type: String,
    required: true // "Fall 2024", "Spring 2025"
  },
  academicYear: {
    type: String,
    required: true // "2024-2025"
  },
  sections: [{
    sectionName: {
      type: String,
      required: true // "A", "B", "C"
    },
    schedule: {
      days: [String], // ["MON", "WED", "FRI"]
      time: String,   // "10:00-11:00"
      room: String
    },
    enrolledStudents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'upcoming'],
    default: 'upcoming'
  },
  startDate: Date,
  endDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
courseOfferingSchema.index({ courseId: 1, semester: 1, academicYear: 1 });

module.exports = mongoose.model('CourseOffering', courseOfferingSchema);
