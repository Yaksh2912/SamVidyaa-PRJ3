const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getUserPoints, claimReward, addPoints } = require('../controllers/userController');

router.get('/me/points', protect, getUserPoints);
router.post('/claim-reward', protect, claimReward);
router.post('/add-points', protect, addPoints);

module.exports = router;
