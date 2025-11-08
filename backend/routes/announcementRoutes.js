const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  acknowledgeAnnouncement,
  archiveAnnouncement
} = require('../controllers/announcementController');

// All routes require authentication
router.use(protect);

// Create announcement - Faculty and Department Admin only
router.post('/', authorize('faculty', 'department_admin'), createAnnouncement);

// Get announcements - All authenticated users
router.get('/', getAnnouncements);

// Get single announcement
router.get('/:id', getAnnouncementById);

// Update announcement - Creator only
router.put('/:id', authorize('faculty', 'department_admin'), updateAnnouncement);

// Acknowledge announcement - Students only
router.post('/:id/acknowledge', authorize('student'), acknowledgeAnnouncement);

// Archive announcement - Creator or Department Admin
router.delete('/:id', authorize('faculty', 'department_admin'), archiveAnnouncement);

module.exports = router;
