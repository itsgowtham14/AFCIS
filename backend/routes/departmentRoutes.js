const express = require('express');
const router = express.Router();
const {
  getAllFaculty,
  assignFacultyToSection,
  getOverallAnalytics,
  getCourseAnalytics,
  getSectionAnalytics,
  createCourseOffering,
  getFacultyPerformance,
  getSectionForms,
  getFormResponsesVisualization,
  getDepartmentAdminAnalytics
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and department_admin role
router.use(protect);
router.use(authorize('department_admin', 'system_admin'));

// Faculty management
router.get('/faculty', getAllFaculty);
router.post('/assign-faculty', assignFacultyToSection);

// Course offerings
router.post('/course-offerings', createCourseOffering);

// Department admin analytics (uses logged-in user's department)
router.get('/analytics', getDepartmentAdminAnalytics);

// Analytics routes
router.get('/analytics/overall', getOverallAnalytics);
router.get('/analytics/course/:courseId', getCourseAnalytics);
router.get('/analytics/section/:offeringId/:sectionName', getSectionAnalytics);

// Faculty performance routes
router.get('/faculty/:facultyId/performance', getFacultyPerformance);
router.get('/faculty/:facultyId/sections/:offeringId/:sectionName/forms', getSectionForms);
router.get('/forms/:formId/responses', getFormResponsesVisualization);

module.exports = router;

