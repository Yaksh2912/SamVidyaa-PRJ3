const mongoose = require('mongoose');

const studentProgressSchema = mongoose.Schema(
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
            ref: 'Module',
        },
        completed_tasks: {
            type: Number,
            default: 0,
        },
        module_test_completed: {
            type: Boolean,
            default: false,
        },
        course_test_completed: {
            type: Boolean,
            default: false,
        },
        total_score: {
            type: Number,
            default: 0,
        },
        module_status: {
            type: String,
            enum: ['NOT_STARTED', 'IN_PROGRESS', 'TASKS_COMPLETED', 'MODULE_COMPLETED'],
            default: 'NOT_STARTED',
        },
        can_attempt_module_test: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure unique progress record per student-course-module
studentProgressSchema.index({ student_id: 1, course_id: 1, module_id: 1 }, { unique: true });

module.exports = mongoose.model('StudentProgress', studentProgressSchema);
