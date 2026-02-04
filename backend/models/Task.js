const mongoose = require('mongoose');

const taskSchema = mongoose.Schema(
    {
        module_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Module',
        },
        task_name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        problem_statement: {
            type: String,
            required: true,
        },
        expected_output: {
            type: String,
        },
        sample_input: {
            type: String,
        },
        sample_output: {
            type: String,
        },
        difficulty: {
            type: String,
            enum: ['EASY', 'MEDIUM', 'HARD'],
            default: 'MEDIUM',
        },
        points: {
            type: Number,
            default: 10,
        },
        time_limit: {
            type: Number,
            default: 30, // minutes
        },
        language: {
            type: String,
            default: 'Python',
        },
        test_cases_count: {
            type: Number,
            default: 0,
        },
        test_cases: [
            {
                input: String,
                expected_output: String,
                is_sample: { type: Boolean, default: false },
                order_index: Number
            }
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Task', taskSchema);
