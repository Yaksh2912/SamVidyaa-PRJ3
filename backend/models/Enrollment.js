const mongoose = require('mongoose');

const enrollmentSchema = mongoose.Schema(
    {
        course_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Course',
        },
        student_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'DROPPED', 'COMPLETED', 'PENDING', 'REJECTED'],
            default: 'PENDING',
        },
        enrollment_date: {
            type: Date,
            default: Date.now,
        }
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate enrollments
enrollmentSchema.index({ course_id: 1, student_id: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
