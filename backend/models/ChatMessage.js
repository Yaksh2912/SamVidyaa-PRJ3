const mongoose = require('mongoose');

const chatMessageSchema = mongoose.Schema(
    {
        student_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
            index: true,
        },
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        sources: [
            {
                type: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Index for fast retrieval of recent conversation history
chatMessageSchema.index({ student_id: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
