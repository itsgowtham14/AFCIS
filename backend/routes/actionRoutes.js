const express = require('express');
const router = express.Router();
const {
  createActionItem,
  getActionItems,
  updateActionItem,
  addEvidence,
  getDepartmentInsights,
  generateInsights,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/actionController');
const { protect, authorize } = require('../middleware/auth');

// Action Items
router.route('/actions')
  .get(protect, getActionItems)
  .post(protect, authorize('faculty', 'department_admin', 'system_admin'), createActionItem);

router.put('/actions/:id', protect, updateActionItem);
router.post('/actions/:id/evidence', protect, authorize('faculty'), addEvidence);

// Department Insights
router.get('/insights', protect, authorize('department_admin', 'system_admin'), getDepartmentInsights);
router.post('/insights/generate', protect, authorize('department_admin', 'system_admin'), generateInsights);

// Notifications
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);
router.put('/notifications/read-all', protect, markAllNotificationsRead);

module.exports = router;
