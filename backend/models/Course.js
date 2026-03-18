const mongoose = require('mongoose');

const courseSchema = mongoose.Schema(
    {
        course_code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        course_name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        subject: {
            type: String,
            required: true,
        },
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        course_test_questions: {
            type: Number,
            default: 5,
        },
        is_active: {
            type: Boolean,
            default: true,
        },
        points: {
            type: Number,
            default: 1000,
        },
        handout_filename: {
            type: String,
            default: null,
        },
        handout_path: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
