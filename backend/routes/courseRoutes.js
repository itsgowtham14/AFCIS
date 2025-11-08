const express = require('express');
const router = express.Router();
const {
  getCourses,
  createCourse,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseOfferings,
  createCourseOffering,
  getCourseOfferingById,
  updateCourseOffering,
  enrollStudent,
  getFacultyCourses,
  assignFaculty
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

// Courses
router.route('/')
  .get(protect, getCourses)
  .post(protect, authorize('system_admin', 'department_admin'), createCourse);

// Course Offerings - MUST be before /:id routes
router.route('/offerings')
  .get(protect, getCourseOfferings)
  .post(protect, authorize('system_admin', 'department_admin'), createCourseOffering);

router.route('/offerings/:id')
  .get(protect, getCourseOfferingById)
  .put(protect, authorize('system_admin', 'department_admin'), updateCourseOffering);

router.post('/offerings/:id/enroll', protect, authorize('system_admin', 'department_admin'), enrollStudent);

// Faculty Assignments - before /:id routes
router.get('/faculty/:facultyId', protect, getFacultyCourses);
router.post('/assignments', protect, authorize('system_admin', 'department_admin'), assignFaculty);

// Specific course by ID - MUST be last
router.route('/:id')
  .get(protect, getCourseById)
  .put(protect, authorize('system_admin', 'department_admin'), updateCourse)
  .delete(protect, authorize('system_admin'), deleteCourse);

module.exports = router;
