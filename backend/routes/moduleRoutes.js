const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, instructorOrAdmin } = require('../middleware/authMiddleware');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');
const {
    handleUploadMiddleware,
    validateModuleCreateRequest,
    validateModuleUpdateRequest,
    validateModuleFileDeleteRequest,
    validateCourseIdParam,
} = require('../middleware/requestValidation');
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
    .post(protect, instructorOrAdmin, moduleUploadRateLimiter, handleUploadMiddleware(upload.array('files')), validateModuleCreateRequest, createModule)
    .get(protect, getTeacherModules);

router.route('/course/:courseId')
    .get(protect, getCourseModules);

router.route('/:id/export')
    .get(protect, exportModule);

router.route('/:id/files')
    .delete(protect, instructorOrAdmin, validateModuleFileDeleteRequest, deleteModuleFile);

router.route('/:id')
    .get(protect, getModuleById)
    .put(protect, instructorOrAdmin, moduleUploadRateLimiter, handleUploadMiddleware(upload.array('files')), validateModuleUpdateRequest, updateModule)
    .delete(protect, instructorOrAdmin, validateCourseIdParam, deleteModule);



module.exports = router;
