const mongoose = require('mongoose');

const collaborationRequestSchema = mongoose.Schema(
    {
        task_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Task',
        },
        course_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Course',
        },
        requester: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        requested_peer: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        status: {
            type: String,
            enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
            default: 'PENDING',
        }
    },
    {
        timestamps: true,
    }
);

// Optional compound index to prevent duplicate pending requests between the same peers for the same task
collaborationRequestSchema.index({ task_id: 1, requester: 1, requested_peer: 1 }, { unique: true });

module.exports = mongoose.model('CollaborationRequest', collaborationRequestSchema);
