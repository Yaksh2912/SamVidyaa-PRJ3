const mongoose = require('mongoose');

const moduleSchema = mongoose.Schema(
    {
        course_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Course',
        },
        module_name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        module_order: {
            type: Number,
            required: true,
        },
        tasks_per_module: {
            type: Number,
            default: 10,
        },
        module_test_questions: {
            type: Number,
            default: 3,
        },
        total_tasks: {
            type: Number,
            default: 0,
        },
        total_test_questions: {
            type: Number,
            default: 0,
        },
        is_active: {
            type: Boolean,
            default: true,
        },
        files: [
            {
                name: { type: String, required: true },
                path: { type: String, required: true },
                mimetype: { type: String },
                size: { type: Number },
            },
        ],
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

module.exports = mongoose.model('Module', moduleSchema);
