const mongoose = require('mongoose');

const codingQuestionSchema = mongoose.Schema(
    {
        module_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Module',
            required: function () { return this.question_type === 'MODULE_TEST'; }
        },
        course_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true
        },
        question_type: {
            type: String,
            enum: ['MODULE_TEST', 'COURSE_TEST'],
            required: true
        },
        question_text: {
            type: String,
            required: true,
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
            default: 20,
        },
        time_limit: {
            type: Number,
            default: 45, // minutes
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

module.exports = mongoose.model('CodingQuestion', codingQuestionSchema);
