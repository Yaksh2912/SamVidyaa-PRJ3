const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    createReward, 
    getCourseRewards, 
    getStudentRewards, 
    deleteReward 
} = require('../controllers/rewardController');

router.route('/')
    .post(protect, createReward);

router.route('/student')
    .get(protect, getStudentRewards);

router.route('/course/:courseId')
    .get(protect, getCourseRewards);

router.route('/:id')
    .delete(protect, deleteReward);

module.exports = router;
