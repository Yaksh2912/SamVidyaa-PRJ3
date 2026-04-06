const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');
const { createModule, updateModule, getTeacherModules, getCourseModules, getModuleById, deleteModuleFile, deleteModule, exportModule } = require('../controllers/moduleController');

// Multer Config
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
});
const moduleUploadRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: 'Too many module upload requests. Please wait before trying again.',
});

router.route('/')
    .post(protect, moduleUploadRateLimiter, upload.array('files'), createModule)
    .get(protect, getTeacherModules);

router.route('/course/:courseId')
    .get(protect, getCourseModules);

router.route('/:id/export')
    .get(protect, exportModule);

router.route('/:id/files')
    .delete(protect, deleteModuleFile);

router.route('/:id')
    .get(protect, getModuleById)
    .put(protect, moduleUploadRateLimiter, upload.array('files'), updateModule)
    .delete(protect, deleteModule);



module.exports = router;
