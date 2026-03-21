const User = require('../models/User');
const Reward = require('../models/Reward');
const PointTransaction = require('../models/PointTransaction');

// @desc    Get current user's points
// @route   GET /api/users/me/points
// @access  Private
const getUserPoints = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('points');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ points: user.points || 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch points' });
    }
};

// @desc    Claim a reward (deduct points)
// @route   POST /api/users/claim-reward
// @access  Private
const claimReward = async (req, res) => {
    try {
        const { rewardId } = req.body;

        if (!rewardId) {
            return res.status(400).json({ message: 'Reward ID is required' });
        }

        const reward = await Reward.findById(rewardId);
        if (!reward) {
            return res.status(404).json({ message: 'Reward not found' });
        }

        const cost = reward.cost;
        const rewardName = reward.name;

        if (cost <= 0) {
            return res.status(400).json({ message: 'Invalid reward cost' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if ((user.points || 0) < cost) {
            return res.status(400).json({ message: 'Not enough points' });
        }

        user.points = (user.points || 0) - cost;
        await user.save();

        await PointTransaction.create({
            user_id: user._id,
            amount: -cost,
            reason: `Claimed reward: ${rewardName}`
        });

        res.json({
            message: `Successfully claimed "${rewardName}"!`,
            points: user.points,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to claim reward' });
    }
};

// @desc    Add points to user (for testing / mock)
// @route   POST /api/users/add-points
// @access  Private
const addPoints = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.points = (user.points || 0) + amount;
        await user.save();

        await PointTransaction.create({
            user_id: user._id,
            amount: amount,
            reason: 'Earned points'
        });

        res.json({
            message: `Added ${amount} points!`,
            points: user.points,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add points' });
    }
};

module.exports = { getUserPoints, claimReward, addPoints };
