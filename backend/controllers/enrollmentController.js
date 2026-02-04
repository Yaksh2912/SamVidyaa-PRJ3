const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Course = require('../models/Course');

// @desc    Enroll a student in a course
// @route   POST /api/enrollments
// @access  Private (Teacher/Admin - maybe student too later)
const enrollStudent = async (req, res) => {
    try {
        const { course_id, student_email } = req.body;

        if (!course_id || !student_email) {
            return res.status(400).json({ message: 'Course ID and Student Email are required' });
        }

        const student = await User.findOne({ email: student_email });
        if (!student) {
            return res.status(404).json({ message: 'Student not found with that email' });
        }

        const enrollmentExists = await Enrollment.findOne({ course_id, student_id: student._id });
        if (enrollmentExists) {
            return res.status(400).json({ message: 'Student already enrolled' });
        }

        const enrollment = await Enrollment.create({
            course_id,
            student_id: student._id,
        });

        res.status(201).json(enrollment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Enrollment failed' });
    }
};

// @desc    Get all students enrolled in a course
// @route   GET /api/enrollments/course/:courseId
// @access  Private
const getEnrolledStudents = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ course_id: req.params.courseId })
            .populate('student_id', 'name email enrollment_number');

        // Transform to return just students with enrollment info
        const students = enrollments.map(e => ({
            _id: e.student_id._id,
            name: e.student_id.name,
            email: e.student_id.email,
            enrollment_number: e.student_id.enrollment_number,
            status: e.status,
            enrolledAt: e.createdAt
        }));

        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch enrolled students' });
    }
};

// @desc    Get all courses a student is enrolled in
// @route   GET /api/enrollments/student
// @access  Private
const getStudentEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ student_id: req.user._id })
            .populate('course_id');

        res.json(enrollments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch enrollments' });
    }
};

module.exports = {
    enrollStudent,
    getEnrolledStudents,
    getStudentEnrollments
};
