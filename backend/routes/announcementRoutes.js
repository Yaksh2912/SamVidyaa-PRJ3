const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createAnnouncement,
    getManageAnnouncements,
    getStudentAnnouncements,
    deleteAnnouncement,
} = require('../controllers/announcementController');

router.get('/manage', protect, getManageAnnouncements);
router.get('/student', protect, getStudentAnnouncements);
router.post('/', protect, createAnnouncement);
router.delete('/:id', protect, deleteAnnouncement);

module.exports = router;
