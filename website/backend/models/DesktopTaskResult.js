const mongoose = require('mongoose');

const desktopTaskResultSchema = mongoose.Schema(
    {
        student_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        course_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Course',
        },
        module_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Module',
        },
        task_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Task',
        },
        status: {
            type: String,
            enum: ['PASSED', 'FAILED'],
            required: true,
        },
        passed_test_cases: {
            type: Number,
            default: 0,
            min: 0,
        },
        total_test_cases: {
            type: Number,
            default: 0,
            min: 0,
        },
        runtime_ms: {
            type: Number,
            default: null,
            min: 0,
        },
        language: {
            type: String,
            default: '',
        },
        app_version: {
            type: String,
            default: '',
        },
        execution_ref: {
            type: String,
            default: '',
        },
        submitted_at: {
            type: Date,
            default: Date.now,
        },
        raw_result: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

desktopTaskResultSchema.index({ student_id: 1, task_id: 1, createdAt: -1 });
desktopTaskResultSchema.index(
    { student_id: 1, task_id: 1, execution_ref: 1 },
    { unique: true, sparse: true }
);

module.exports = mongoose.model('DesktopTaskResult', desktopTaskResultSchema);
