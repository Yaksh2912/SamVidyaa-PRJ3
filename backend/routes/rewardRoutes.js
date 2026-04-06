const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validateRewardCreateRequest, validateRewardDeleteRequest } = require('../middleware/requestValidation');
const { 
    createReward, 
    getCourseRewards, 
    getStudentRewards, 
    deleteReward 
} = require('../controllers/rewardController');

router.route('/')
    .post(protect, validateRewardCreateRequest, createReward);

router.route('/student')
    .get(protect, getStudentRewards);

router.route('/course/:courseId')
    .get(protect, getCourseRewards);

router.route('/:id')
    .delete(protect, validateRewardDeleteRequest, deleteReward);

module.exports = router;
