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
            if (enrollmentExists.status === 'REJECTED' || enrollmentExists.status === 'DROPPED') {
                // Allow re-enrollment
                enrollmentExists.status = 'PENDING';
                await enrollmentExists.save();
                return res.status(200).json(enrollmentExists);
            }
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
            enrollment_id: e._id,
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

// @desc    Update enrollment status (Approve/Reject)
// @route   PUT /api/enrollments/:id
// @access  Private (Instructor)
const updateEnrollmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const enrollment = await Enrollment.findById(req.params.id).populate('course_id');

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        // Verify that the instructor owns the course
        const course = await Course.findById(enrollment.course_id._id);
        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        enrollment.status = status;
        await enrollment.save();

        res.json(enrollment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update enrollment' });
    }
};

// @desc    Get all courses a student is enrolled in
// @route   GET /api/enrollments/student
// @access  Private
const getStudentEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ student_id: req.user._id })
            .populate({
                path: 'course_id',
                populate: { path: 'instructor', select: 'name' }
            });

        res.json(enrollments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch enrollments' });
    }
};

module.exports = {
    enrollStudent,
    getEnrolledStudents,
    getStudentEnrollments,
    updateEnrollmentStatus
};
