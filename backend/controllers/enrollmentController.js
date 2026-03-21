const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Course = require('../models/Course');
const xlsx = require('xlsx');

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

// @desc    Bulk enroll students by enrollment number range
// @route   POST /api/enrollments/bulk
// @access  Private (Instructor)
const bulkEnrollByRange = async (req, res) => {
    try {
        const { course_id, start_enrollment, end_enrollment } = req.body;

        if (!course_id || !start_enrollment || !end_enrollment) {
            return res.status(400).json({ message: 'Course ID, start and end enrollment numbers are required' });
        }

        // Find all students whose enrollment_number falls in the range
        const students = await User.find({
            role: 'STUDENT',
            enrollment_number: {
                $gte: start_enrollment,
                $lte: end_enrollment
            }
        });

        if (students.length === 0) {
            return res.status(404).json({ message: 'No students found in the given enrollment number range' });
        }

        let enrolled = 0;
        let skipped = 0;

        for (const student of students) {
            try {
                const existing = await Enrollment.findOne({ course_id, student_id: student._id });
                if (existing) {
                    // If previously rejected/dropped, re-activate
                    if (existing.status === 'REJECTED' || existing.status === 'DROPPED') {
                        existing.status = 'ACTIVE';
                        await existing.save();
                        enrolled++;
                    } else {
                        skipped++;
                    }
                } else {
                    await Enrollment.create({
                        course_id,
                        student_id: student._id,
                        status: 'ACTIVE'
                    });
                    enrolled++;
                }
            } catch (err) {
                // Duplicate key or other error — skip
                skipped++;
            }
        }

        res.status(200).json({
            message: `Enrollment complete`,
            enrolled,
            skipped,
            total_in_range: students.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Bulk enrollment failed' });
    }
};

// @desc    Bulk enroll students from Excel file
// @route   POST /api/enrollments/excel-upload
// @access  Private (Instructor)
const bulkEnrollByExcel = async (req, res) => {
    try {
        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ message: 'Course ID is required' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Excel file is required' });
        }

        // Parse excel buffer
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        let enrolled = 0;
        let skipped = 0;
        let not_found = 0;

        for (const row of data) {
            // Normalize keys to find email and enrollment number loosely
            const normalizedRow = {};
            for (const key in row) {
                normalizedRow[key.toString().toLowerCase().replace(/[^a-z0-9]/g, '')] = row[key];
            }

            const email = normalizedRow['email'];
            const enrollmentNumber = normalizedRow['enrolmentnumber'] || normalizedRow['enrollmentnumber'];

            if (!email || !enrollmentNumber) {
                // If row doesn't have required fields, skip it
                continue;
            }

            // Find student
            const student = await User.findOne({
                role: 'STUDENT',
                email: email,
                // Match either string or number format by using $regex or just exact match. Usually exact match.
                // We'll enforce string match assuming enrollment_number is string
                enrollment_number: enrollmentNumber.toString()
            });

            if (!student) {
                not_found++;
                continue;
            }

            try {
                const existing = await Enrollment.findOne({ course_id, student_id: student._id });
                if (existing) {
                    // If previously rejected/dropped, re-activate
                    if (existing.status === 'REJECTED' || existing.status === 'DROPPED') {
                        existing.status = 'ACTIVE';
                        await existing.save();
                        enrolled++;
                    } else {
                        skipped++;
                    }
                } else {
                    await Enrollment.create({
                        course_id,
                        student_id: student._id,
                        status: 'ACTIVE'
                    });
                    enrolled++;
                }
            } catch (err) {
                skipped++;
            }
        }

        res.status(200).json({
            message: `Excel enrollment processed`,
            enrolled,
            skipped,
            not_found,
            total_processed: data.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Excel bulk enrollment failed' });
    }
};

module.exports = {
    enrollStudent,
    getEnrolledStudents,
    getStudentEnrollments,
    updateEnrollmentStatus,
    bulkEnrollByRange,
    bulkEnrollByExcel
};
