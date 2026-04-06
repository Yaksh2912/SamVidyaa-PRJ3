const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getUserPoints, claimReward, getPublicPlatformStats, createPrivilegedUser } = require('../controllers/userController');

router.get('/public-stats', getPublicPlatformStats);
router.get('/me/points', protect, getUserPoints);
router.post('/staff', protect, admin, createPrivilegedUser);
router.post('/claim-reward', protect, claimReward);

module.exports = router;
