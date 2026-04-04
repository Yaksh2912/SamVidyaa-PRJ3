const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getUserPoints, claimReward, addPoints, getPublicPlatformStats } = require('../controllers/userController');

router.get('/public-stats', getPublicPlatformStats);
router.get('/me/points', protect, getUserPoints);
router.post('/claim-reward', protect, claimReward);
router.post('/add-points', protect, addPoints);

module.exports = router;
