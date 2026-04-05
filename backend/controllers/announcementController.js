const Announcement = require('../models/Announcement');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const isAdminRole = (role) => role === 'ADMIN' || role === 'admin';
const isInstructorRole = (role) => role === 'INSTRUCTOR' || role === 'instructor' || role === 'TEACHER' || role === 'teacher';

const ANNOUNCEMENT_POPULATE = [
    { path: 'course_id', select: 'course_name course_code' },
    { path: 'created_by', select: 'name role email' },
];

const verifyManagedCourse = async (courseId, user) => {
    const course = await Course.findById(courseId).select('course_name course_code instructor');

    if (!course) {
        return { error: { status: 404, message: 'Course not found' } };
    }

    if (isAdminRole(user.role)) {
        return { course };
    }

    if (course.instructor?.toString() === user._id.toString()) {
        return { course };
    }

    return { error: { status: 401, message: 'Not authorized for this course' } };
};

const normalizeAudience = (value) => {
    if (typeof value !== 'string') return 'COURSE';
    const normalized = value.trim().toUpperCase();
    return normalized === 'GLOBAL' ? 'GLOBAL' : 'COURSE';
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private (Instructor/Admin)
const createAnnouncement = async (req, res) => {
    try {
        if (!isInstructorRole(req.user.role) && !isAdminRole(req.user.role)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const title = req.body.title?.trim();
        const message = req.body.message?.trim();
        const requestedAudience = normalizeAudience(req.body.audience_type);
        const requestedCourseId = req.body.course_id || null;

        if (!title || !message) {
            return res.status(400).json({ message: 'Title and message are required' });
        }

        let audienceType = requestedAudience;
        let courseId = requestedCourseId;

        if (isInstructorRole(req.user.role)) {
            audienceType = 'COURSE';
            if (!courseId) {
                return res.status(400).json({ message: 'Course is required for instructor announcements' });
            }
        } else if (audienceType === 'GLOBAL') {
            courseId = null;
        } else if (!courseId) {
            return res.status(400).json({ message: 'Course is required for course announcements' });
        }

        if (courseId) {
            const courseAccess = await verifyManagedCourse(courseId, req.user);
            if (courseAccess.error) {
                return res.status(courseAccess.error.status).json({ message: courseAccess.error.message });
            }
        }

        const announcement = await Announcement.create({
            title,
            message,
            audience_type: audienceType,
            course_id: courseId,
            created_by: req.user._id,
        });

        const populatedAnnouncement = await announcement.populate(ANNOUNCEMENT_POPULATE);
        return res.status(201).json(populatedAnnouncement);
    } catch (error) {
        console.error('Create announcement failed', error);
        return res.status(400).json({ message: 'Failed to create announcement' });
    }
};

// @desc    Get announcements manageable by current user
// @route   GET /api/announcements/manage
// @access  Private (Instructor/Admin)
const getManageAnnouncements = async (req, res) => {
    try {
        if (!isInstructorRole(req.user.role) && !isAdminRole(req.user.role)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const query = isAdminRole(req.user.role)
            ? {}
            : { created_by: req.user._id };

        const announcements = await Announcement.find(query)
            .sort({ createdAt: -1 })
            .populate(ANNOUNCEMENT_POPULATE)
            .lean();

        return res.json(announcements);
    } catch (error) {
        console.error('Fetch managed announcements failed', error);
        return res.status(400).json({ message: 'Failed to fetch announcements' });
    }
};

// @desc    Get announcements relevant to current student
// @route   GET /api/announcements/student
// @access  Private (Student)
const getStudentAnnouncements = async (req, res) => {
    try {
        if (req.user.role !== 'STUDENT') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const enrollments = await Enrollment.find({
            student_id: req.user._id,
            status: { $in: ['ACTIVE', 'APPROVED', 'COMPLETED'] },
        })
            .select('course_id')
            .lean();

        const enrolledCourseIds = enrollments
            .map((enrollment) => enrollment.course_id)
            .filter(Boolean);

        const announcements = await Announcement.find({
            $or: [
                { audience_type: 'GLOBAL' },
                { audience_type: 'COURSE', course_id: { $in: enrolledCourseIds } },
            ],
        })
            .sort({ createdAt: -1 })
            .populate(ANNOUNCEMENT_POPULATE)
            .lean();

        return res.json(announcements);
    } catch (error) {
        console.error('Fetch student announcements failed', error);
        return res.status(400).json({ message: 'Failed to fetch announcements' });
    }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Instructor/Admin)
const deleteAnnouncement = async (req, res) => {
    try {
        if (!isInstructorRole(req.user.role) && !isAdminRole(req.user.role)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        if (!isAdminRole(req.user.role) && announcement.created_by?.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this announcement' });
        }

        await announcement.deleteOne();
        return res.json({ message: 'Announcement deleted' });
    } catch (error) {
        console.error('Delete announcement failed', error);
        return res.status(400).json({ message: 'Failed to delete announcement' });
    }
};

module.exports = {
    createAnnouncement,
    getManageAnnouncements,
    getStudentAnnouncements,
    deleteAnnouncement,
};
