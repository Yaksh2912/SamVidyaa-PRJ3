const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');
const {
    handleUploadMiddleware,
    validateCourseCreateRequest,
    validateCourseUpdateRequest,
    validateCourseIdParam,
    validateCourseHandoutUploadRequest,
} = require('../middleware/requestValidation');
const {
    createCourse,
    updateCourse,
    getCourses,
    getCourseById,
    deleteCourse,
    getTeacherStats,
    getCourseAnalytics,
    uploadHandout,
    deleteHandout,
    handoutUploadMiddleware,
} = require('../controllers/courseController');
const handoutUploadRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: 'Too many handout upload requests. Please wait before trying again.',
});

router.route('/')
    .post(protect, validateCourseCreateRequest, createCourse)
    .get(protect, getCourses);

router.get('/stats', protect, getTeacherStats); // Stats route must be before :id
router.get('/:id/analytics', protect, getCourseAnalytics);

router.route('/:id')
    .get(protect, getCourseById)
    .put(protect, validateCourseUpdateRequest, updateCourse)
    .delete(protect, validateCourseIdParam, deleteCourse);

router.get('/:id/export', protect, require('../controllers/courseController').exportCourse);

// Handout routes
router.post('/:id/handout', protect, handoutUploadRateLimiter, handleUploadMiddleware(handoutUploadMiddleware), validateCourseHandoutUploadRequest, uploadHandout);
router.delete('/:id/handout', protect, validateCourseIdParam, deleteHandout);

module.exports = router;
