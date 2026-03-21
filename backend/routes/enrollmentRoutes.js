const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { enrollStudent, getEnrolledStudents, getStudentEnrollments, updateEnrollmentStatus, bulkEnrollByRange, bulkEnrollByExcel } = require('../controllers/enrollmentController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', protect, enrollStudent);
router.post('/bulk', protect, bulkEnrollByRange);
router.post('/excel-upload', protect, upload.single('excel'), bulkEnrollByExcel);
router.put('/:id', protect, updateEnrollmentStatus);
router.get('/course/:courseId', protect, getEnrolledStudents);
router.get('/student', protect, getStudentEnrollments);

module.exports = router;
