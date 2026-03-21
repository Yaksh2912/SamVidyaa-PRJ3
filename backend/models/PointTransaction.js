const mongoose = require('mongoose');

const pointTransactionSchema = mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        amount: {
            type: Number,
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
        course_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            default: null
        }
    },
    {
        timestamps: true,
    }
);

// Indexes to speed up queries for leaderboard
pointTransactionSchema.index({ user_id: 1, createdAt: -1 });
pointTransactionSchema.index({ createdAt: -1 });
pointTransactionSchema.index({ course_id: 1, createdAt: -1 });

module.exports = mongoose.model('PointTransaction', pointTransactionSchema);
