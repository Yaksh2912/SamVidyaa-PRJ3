const mongoose = require('mongoose');

const rewardSchema = mongoose.Schema(
    {
        course_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Course',
        },
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        cost: {
            type: Number,
            required: true,
        },
        icon_name: {
            type: String,
            default: 'HiGift',
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Reward', rewardSchema);
