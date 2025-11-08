const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  bulkCreateStudents,
  bulkCreateFaculty,
  bulkCreateDeptAdmin,
  getFacultyCourseInfo,
  fixFacultySections,
  fixStudentSections
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Bulk creation routes (role-specific)
router.post('/bulk-students', protect, authorize('system_admin'), bulkCreateStudents);
router.post('/bulk-faculty', protect, authorize('system_admin'), bulkCreateFaculty);
router.post('/bulk-deptadmin', protect, authorize('system_admin'), bulkCreateDeptAdmin);

// Migration helpers to fix sections
router.post('/fix-faculty-sections', protect, authorize('system_admin'), fixFacultySections);
router.post('/fix-student-sections', protect, authorize('system_admin'), fixStudentSections);

router.route('/')
  .get(protect, authorize('system_admin', 'department_admin'), getUsers)
  .post(protect, authorize('system_admin', 'department_admin'), createUser);

router.route('/:id')
  .get(protect, getUserById)
  .put(protect, authorize('system_admin', 'department_admin'), updateUser)
  .delete(protect, authorize('system_admin'), deleteUser);

router.get('/:id/courses', protect, getFacultyCourseInfo);
router.put('/:id/toggle-status', protect, authorize('system_admin'), toggleUserStatus);

module.exports = router;
