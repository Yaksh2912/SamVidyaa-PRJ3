const express = require('express');
const router = express.Router();
const { getGlobalLeaderboard, getWeeklyLeaderboard, getClassLeaderboard, getPeerLeaderboard } = require('../controllers/leaderboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/global', protect, getGlobalLeaderboard);
router.get('/weekly', protect, getWeeklyLeaderboard);
router.get('/class/:courseId', protect, getClassLeaderboard);
router.get('/peers', protect, getPeerLeaderboard);

module.exports = router;
