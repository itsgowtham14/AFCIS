const express = require('express');
const router = express.Router();
const {
  createFeedbackForm,
  getFeedbackForms,
  getFeedbackFormById,
  updateFeedbackForm,
  deleteFeedbackForm,
  getActiveFeedbackForStudent,
  submitFeedbackResponse,
  getFeedbackResponses,
  getFeedbackAnalytics,
  getDepartmentAnalytics,
  getCourseAnalytics,
  getFacultyAnalytics,
  getStudentFeedbackHistory,
  getStudentFeedbackStats
} = require('../controllers/feedbackController');
const {
  getFacultyFormAnalytics,
  getFacultyPerformanceTrends
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

// Feedback Forms
router.route('/forms')
  .get(protect, getFeedbackForms)
  .post(protect, authorize('faculty', 'system_admin'), createFeedbackForm);

router.route('/forms/:id')
  .get(protect, getFeedbackFormById)
  .put(protect, authorize('faculty', 'department_admin', 'system_admin'), updateFeedbackForm)
  .delete(protect, authorize('faculty', 'department_admin', 'system_admin'), deleteFeedbackForm);

router.get('/forms/:id/responses', protect, authorize('faculty', 'department_admin', 'system_admin'), getFeedbackResponses);
router.get('/forms/:id/analytics', protect, authorize('faculty', 'department_admin', 'system_admin'), getFeedbackAnalytics);

// Department Admin routes
router.get('/department/analytics', protect, authorize('department_admin', 'system_admin'), getDepartmentAnalytics);
router.get('/department/courses/:courseId/analytics', protect, authorize('department_admin', 'system_admin'), getCourseAnalytics);
router.get('/department/faculty/:facultyId/analytics', protect, authorize('department_admin', 'system_admin'), getFacultyAnalytics);

// Student-specific routes
router.get('/active', protect, authorize('student'), getActiveFeedbackForStudent);
router.post('/responses', protect, authorize('student'), submitFeedbackResponse);
router.get('/my-history', protect, authorize('student'), getStudentFeedbackHistory);
router.get('/student-stats', protect, authorize('student'), getStudentFeedbackStats);

// Faculty analytics routes (aggregated data only)
router.get('/faculty/:facultyId/forms/:formId/analytics', protect, authorize('faculty', 'department_admin', 'system_admin'), getFacultyFormAnalytics);
router.get('/faculty/:facultyId/trends', protect, authorize('faculty', 'department_admin', 'system_admin'), getFacultyPerformanceTrends);

module.exports = router;
