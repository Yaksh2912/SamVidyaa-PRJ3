const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');
const Enrollment = require('../models/Enrollment');

// @desc    Get Global Leaderboard
// @route   GET /api/leaderboard/global
// @access  Private
const getGlobalLeaderboard = async (req, res) => {
    try {
        const topUsers = await User.find({ role: 'STUDENT' })
            .select('name username points')
            .sort({ points: -1 })
            .limit(50);
        res.json(topUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch global leaderboard' });
    }
};

// @desc    Get Weekly Leaderboard
// @route   GET /api/leaderboard/weekly
// @access  Private
const getWeeklyLeaderboard = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const pointAggregation = await PointTransaction.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo }, amount: { $gt: 0 } } },
            { $group: { _id: "$user_id", weeklyPoints: { $sum: "$amount" } } },
            { $sort: { weeklyPoints: -1 } },
            { $limit: 50 }
        ]);

        await User.populate(pointAggregation, { path: '_id', select: 'name username points' });

        const mappedResult = pointAggregation.map(item => {
            return {
                _id: item._id?._id,
                name: item._id?.name || 'Unknown',
                username: item._id?.username,
                points: item.weeklyPoints // Use weekly points here for sorting display
            };
        }).filter(item => item._id);

        res.json(mappedResult);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch weekly leaderboard' });
    }
};

// @desc    Get Class Leaderboard
// @route   GET /api/leaderboard/class/:courseId
// @access  Private
const getClassLeaderboard = async (req, res) => {
    try {
        const { courseId } = req.params;

        // 1. Get all students enrolled in this course
        const enrollments = await Enrollment.find({ 
            course_id: courseId, 
            status: { $in: ['ACTIVE', 'APPROVED', 'PENDING'] }
        }).select('student_id');
        
        const studentIds = enrollments.map(e => e.student_id);

        // 2. We can aggregate points specifically earned AT this course IF we tracked course_id in transactions.
        // For MVP, we'll follow a common pattern: ranking classmates by their global points.
        const classmates = await User.find({ _id: { $in: studentIds } })
            .select('name username points')
            .sort({ points: -1 })
            .limit(50);

        res.json(classmates);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch class leaderboard' });
    }
};

// @desc    Get Peer Leaderboard (Colab Ranking based on teamwork points)
// @route   GET /api/leaderboard/peers
// @access  Private
const getPeerLeaderboard = async (req, res) => {
    try {
        const pointAggregation = await PointTransaction.aggregate([
            { $match: { reason: "Collaboration/Teamwork", amount: { $gt: 0 } } },
            { $group: { _id: "$user_id", colabPoints: { $sum: "$amount" } } },
            { $sort: { colabPoints: -1 } },
            { $limit: 50 }
        ]);

        await User.populate(pointAggregation, { path: '_id', select: 'name username points' });

        const mappedResult = pointAggregation.map(item => {
            return {
                _id: item._id?._id,
                name: item._id?.name || 'Unknown',
                username: item._id?.username,
                points: item.colabPoints, // Use colab points here for sorting/display
                isCurrentUser: req.user._id && item._id?._id && item._id._id.toString() === req.user._id.toString()
            };
        }).filter(item => item._id);

        res.json(mappedResult);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch peer leaderboard' });
    }
};

module.exports = { getGlobalLeaderboard, getWeeklyLeaderboard, getClassLeaderboard, getPeerLeaderboard };
