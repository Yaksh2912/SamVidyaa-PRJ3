const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validateAnnouncementCreateRequest, validateAnnouncementDeleteRequest } = require('../middleware/requestValidation');
const {
    createAnnouncement,
    getManageAnnouncements,
    getStudentAnnouncements,
    deleteAnnouncement,
} = require('../controllers/announcementController');

router.get('/manage', protect, getManageAnnouncements);
router.get('/student', protect, getStudentAnnouncements);
router.post('/', protect, validateAnnouncementCreateRequest, createAnnouncement);
router.delete('/:id', protect, validateAnnouncementDeleteRequest, deleteAnnouncement);

module.exports = router;
