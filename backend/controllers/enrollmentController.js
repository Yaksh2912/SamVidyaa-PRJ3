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

const authorizeCourseEnrollmentAccess = async (courseId, user) => {
    const course = await Course.findById(courseId);

    if (!course) {
        return { error: { status: 404, message: 'Course not found' } };
    }

    if (course.instructor.toString() !== user._id.toString() && user.role !== 'ADMIN') {
        return { error: { status: 401, message: 'Not authorized' } };
    }

    return { course };
};

const applyBulkEnrollmentChanges = async (courseId, studentIds = []) => {
    const normalizedIds = [...new Set(studentIds.map((studentId) => studentId?.toString()).filter(Boolean))];

    if (!normalizedIds.length) {
        return { enrolled: 0, skipped: 0 };
    }

    const existingEnrollments = await Enrollment.find({
        course_id: courseId,
        student_id: { $in: normalizedIds },
    })
        .select('_id student_id status')
        .lean();

    const existingByStudentId = new Map(
        existingEnrollments.map((enrollment) => [enrollment.student_id.toString(), enrollment])
    );

    const enrollmentIdsToReactivate = [];
    const studentsToCreate = [];
    let skipped = 0;

    for (const studentId of normalizedIds) {
        const existing = existingByStudentId.get(studentId);

        if (!existing) {
            studentsToCreate.push(studentId);
            continue;
        }

        if (existing.status === 'REJECTED' || existing.status === 'DROPPED') {
            enrollmentIdsToReactivate.push(existing._id);
        } else {
            skipped++;
        }
    }

    const [reactivationResult, createResult] = await Promise.all([
        enrollmentIdsToReactivate.length
            ? Enrollment.updateMany(
                {
                    _id: { $in: enrollmentIdsToReactivate },
                    status: { $in: ['REJECTED', 'DROPPED'] },
                },
                { $set: { status: 'ACTIVE' } }
            )
            : { modifiedCount: 0 },
        studentsToCreate.length
            ? Enrollment.bulkWrite(
                studentsToCreate.map((studentId) => ({
                    updateOne: {
                        filter: { course_id: courseId, student_id: studentId },
                        update: {
                            $setOnInsert: {
                                course_id: courseId,
                                student_id: studentId,
                                status: 'ACTIVE',
                            },
                        },
                        upsert: true,
                    },
                })),
                { ordered: false }
            )
            : { upsertedCount: 0 },
    ]);

    const reactivatedCount = reactivationResult.modifiedCount || 0;
    const createdCount = createResult.upsertedCount || 0;

    skipped += (enrollmentIdsToReactivate.length - reactivatedCount);
    skipped += (studentsToCreate.length - createdCount);

    return {
        enrolled: reactivatedCount + createdCount,
        skipped,
    };
};

// @desc    Get all students enrolled in a course
// @route   GET /api/enrollments/course/:courseId
// @access  Private
const getEnrolledStudents = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ course_id: req.params.courseId })
            .populate('student_id', 'name email enrollment_number')
            .lean();

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
            })
            .lean();

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
        }).select('_id');

        if (students.length === 0) {
            return res.status(404).json({ message: 'No students found in the given enrollment number range' });
        }

        const { enrolled, skipped } = await applyBulkEnrollmentChanges(
            course_id,
            students.map((student) => student._id)
        );

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

// @desc    Bulk enroll students by email list
// @route   POST /api/enrollments/bulk-email
// @access  Private (Instructor/Admin)
const bulkEnrollByEmail = async (req, res) => {
    try {
        const { course_id, student_emails } = req.body;

        if (!course_id || !student_emails) {
            return res.status(400).json({ message: 'Course ID and student emails are required' });
        }

        const authorization = await authorizeCourseEnrollmentAccess(course_id, req.user);
        if (authorization.error) {
            return res.status(authorization.error.status).json({ message: authorization.error.message });
        }

        const rawEmails = Array.isArray(student_emails)
            ? student_emails
            : String(student_emails).split(/[\n,;]+/);

        const submittedEmails = rawEmails
            .map((email) => String(email || '').trim().toLowerCase())
            .filter(Boolean);

        if (!submittedEmails.length) {
            return res.status(400).json({ message: 'At least one student email is required' });
        }

        const uniqueEmails = [...new Set(submittedEmails)];
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validEmails = uniqueEmails.filter((email) => emailPattern.test(email));
        const invalid = uniqueEmails.length - validEmails.length;

        if (!validEmails.length) {
            return res.status(400).json({ message: 'No valid student emails were provided' });
        }

        const students = await User.find({
            role: 'STUDENT',
            email: { $in: validEmails }
        })
            .select('_id email')
            .lean();

        const studentsByEmail = new Map(
            students.map((student) => [student.email.toLowerCase(), student])
        );

        let not_found = 0;
        const matchedStudentIds = [];

        for (const email of validEmails) {
            const student = studentsByEmail.get(email);

            if (!student) {
                not_found++;
                continue;
            }

            matchedStudentIds.push(student._id);
        }

        const { enrolled, skipped } = await applyBulkEnrollmentChanges(course_id, matchedStudentIds);

        res.status(200).json({
            message: 'Email enrollment processed',
            enrolled,
            skipped,
            not_found,
            invalid,
            total_processed: uniqueEmails.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Email enrollment failed' });
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
    bulkEnrollByEmail,
    bulkEnrollByExcel
};
