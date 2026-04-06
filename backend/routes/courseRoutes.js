const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');
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
    .post(protect, createCourse)
    .get(protect, getCourses);

router.get('/stats', protect, getTeacherStats); // Stats route must be before :id
router.get('/:id/analytics', protect, getCourseAnalytics);

router.route('/:id')
    .get(protect, getCourseById)
    .put(protect, updateCourse)
    .delete(protect, deleteCourse);

router.get('/:id/export', protect, require('../controllers/courseController').exportCourse);

// Handout routes
router.post('/:id/handout', protect, handoutUploadRateLimiter, handoutUploadMiddleware, uploadHandout);
router.delete('/:id/handout', protect, deleteHandout);

module.exports = router;
