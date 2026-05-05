const mongoose = require('mongoose');

const taskCompletionSchema = mongoose.Schema(
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
        task_name: {
            type: String,
            required: true,
        },
        course_name: {
            type: String,
            default: '',
        },
        module_name: {
            type: String,
            default: '',
        },
        task_language: {
            type: String,
            default: '',
        },
        task_difficulty: {
            type: String,
            default: '',
        },
        task_time_limit: {
            type: Number,
            default: 0,
        },
        task_points: {
            type: Number,
            default: 0,
        },
        points_awarded: {
            type: Number,
            default: 0,
        },
        collaborator_ids: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            }
        ],
        completed_at: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

taskCompletionSchema.index({ student_id: 1, task_id: 1 }, { unique: true });
taskCompletionSchema.index({ student_id: 1, completed_at: -1 });

module.exports = mongoose.model('TaskCompletion', taskCompletionSchema);
