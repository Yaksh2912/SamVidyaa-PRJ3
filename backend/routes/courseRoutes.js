const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createCourse, getCourses, getCourseById, deleteCourse, getTeacherStats } = require('../controllers/courseController');

router.route('/')
    .post(protect, createCourse)
    .get(protect, getCourses);

router.get('/stats', protect, getTeacherStats); // Stats route must be before :id

router.route('/:id')
    .get(protect, getCourseById)
    .delete(protect, deleteCourse);

module.exports = router;
