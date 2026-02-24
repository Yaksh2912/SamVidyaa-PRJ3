const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { enrollStudent, getEnrolledStudents, getStudentEnrollments, updateEnrollmentStatus, bulkEnrollByRange } = require('../controllers/enrollmentController');

router.post('/', protect, enrollStudent);
router.post('/bulk', protect, bulkEnrollByRange);
router.put('/:id', protect, updateEnrollmentStatus);
router.get('/course/:courseId', protect, getEnrolledStudents);
router.get('/student', protect, getStudentEnrollments);

module.exports = router;
