const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { enrollStudent, getEnrolledStudents, getStudentEnrollments, updateEnrollmentStatus, bulkEnrollByRange, bulkEnrollByEmail, bulkEnrollByExcel } = require('../controllers/enrollmentController');
const { handleUploadMiddleware } = require('../middleware/requestValidation');
const multer = require('multer');
const path = require('path');

const enrollmentImportExtensions = new Set(['.csv', '.xlsx']);
const enrollmentImportMimeTypes = new Set([
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter(_req, file, cb) {
        const extension = path.extname(file.originalname || '').toLowerCase();
        if (enrollmentImportExtensions.has(extension) && (!file.mimetype || enrollmentImportMimeTypes.has(file.mimetype))) {
            cb(null, true);
            return;
        }

        cb(new Error('Only CSV and XLSX enrollment files are allowed'));
    },
});

router.post('/', protect, enrollStudent);
router.post('/bulk', protect, bulkEnrollByRange);
router.post('/bulk-email', protect, bulkEnrollByEmail);
router.post('/excel-upload', protect, handleUploadMiddleware(upload.single('excel')), bulkEnrollByExcel);
router.put('/:id', protect, updateEnrollmentStatus);
router.get('/course/:courseId', protect, getEnrolledStudents);
router.get('/student', protect, getStudentEnrollments);

module.exports = router;
