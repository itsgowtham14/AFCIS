const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['feedback_reminder', 'confidential_alert', 'action_required', 'system_update', 'response_received'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  visibility: {
    roles: [String],
    departments: [String]
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['feedback_form', 'action_item', 'course', 'user']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ sentAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
