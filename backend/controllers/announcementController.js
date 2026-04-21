const Announcement = require('../models/Announcement');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { parsePagination, applyPaginationHeaders } = require('../utils/pagination');
const announcementEventService = require('../services/announcementEventService');
const announcementExpiryService = require('../services/announcementExpiryService');

const isAdminRole = (role) => role === 'ADMIN' || role === 'admin';
const isInstructorRole = (role) => role === 'INSTRUCTOR' || role === 'instructor' || role === 'TEACHER' || role === 'teacher';
const isStudentRole = (role) => role === 'STUDENT' || role === 'student';
const ANNOUNCEMENT_MAX_EXPIRY_MINUTES = 10080;

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

const buildActiveAnnouncementQuery = (baseQuery = {}, now = new Date()) => ({
    $and: [
        baseQuery,
        {
            $or: [
                { expires_at: null },
                { expires_at: { $gt: now } },
            ],
        },
    ],
});

const parseExpiryMinutes = (value) => {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > ANNOUNCEMENT_MAX_EXPIRY_MINUTES) {
        return null;
    }

    return parsed;
};

const normalizeAnnouncementRef = (value) => {
    if (!value) return null;
    if (typeof value === 'object' && value._id) return String(value._id);
    return String(value);
};

const isAnnouncementRelevantToStudent = (announcement, enrolledCourseIds) => {
    if (announcement?.audience_type === 'GLOBAL') {
        return true;
    }

    const courseId = normalizeAnnouncementRef(announcement?.course_id);
    return Boolean(courseId && enrolledCourseIds.includes(courseId));
};

const isAnnouncementVisibleToUser = (announcement, userContext) => {
    if (!announcement || !userContext) return false;

    if (userContext.scope === 'ADMIN') {
        return true;
    }

    if (userContext.scope === 'INSTRUCTOR') {
        return normalizeAnnouncementRef(announcement.created_by) === userContext.userId;
    }

    if (userContext.scope === 'STUDENT') {
        return isAnnouncementRelevantToStudent(announcement, userContext.enrolledCourseIds);
    }

    return false;
};

const getAnnouncementStreamContext = async (user) => {
    if (isAdminRole(user.role)) {
        return { scope: 'ADMIN' };
    }

    if (isInstructorRole(user.role)) {
        return { scope: 'INSTRUCTOR', userId: String(user._id) };
    }

    if (isStudentRole(user.role)) {
        const enrollments = await Enrollment.find({
            student_id: user._id,
            status: { $in: ['ACTIVE', 'APPROVED', 'COMPLETED'] },
        })
            .select('course_id')
            .lean();

        return {
            scope: 'STUDENT',
            enrolledCourseIds: enrollments
                .map((enrollment) => normalizeAnnouncementRef(enrollment.course_id))
                .filter(Boolean),
        };
    }

    return null;
};

const writeStreamEvent = (res, eventName, payload) => {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
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
        const expiryMinutes = parseExpiryMinutes(req.body.expires_in_minutes);

        if (!title || !message) {
            return res.status(400).json({ message: 'Title and message are required' });
        }

        let audienceType = requestedAudience;
        let courseId = requestedCourseId;

        if (audienceType === 'GLOBAL') {
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
            expires_at: expiryMinutes ? new Date(Date.now() + (expiryMinutes * 60 * 1000)) : null,
        });

        announcementExpiryService.scheduleAnnouncementExpiry(announcement);
        announcementEventService.publishAnnouncementEvent({
            type: 'created',
            announcement,
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
        const activeQuery = buildActiveAnnouncementQuery(query);
        const pagination = parsePagination(req, { defaultLimit: 50, maxLimit: 100 });

        const [total, announcements] = await Promise.all([
            Announcement.countDocuments(activeQuery),
            Announcement.find(activeQuery)
                .sort({ createdAt: -1 })
                .skip(pagination.skip)
                .limit(pagination.limit)
                .populate(ANNOUNCEMENT_POPULATE)
                .lean(),
        ]);

        applyPaginationHeaders(res, { ...pagination, total });

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
        const query = buildActiveAnnouncementQuery({
            $or: [
                { audience_type: 'GLOBAL' },
                { audience_type: 'COURSE', course_id: { $in: enrolledCourseIds } },
            ],
        });
        const pagination = parsePagination(req, { defaultLimit: 50, maxLimit: 100 });

        const [total, announcements] = await Promise.all([
            Announcement.countDocuments(query),
            Announcement.find(query)
                .sort({ createdAt: -1 })
                .skip(pagination.skip)
                .limit(pagination.limit)
                .populate(ANNOUNCEMENT_POPULATE)
                .lean(),
        ]);

        applyPaginationHeaders(res, { ...pagination, total });

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

        announcementExpiryService.clearAnnouncementExpiry(announcement._id);
        await announcement.deleteOne();
        announcementEventService.publishAnnouncementEvent({
            type: 'deleted',
            announcement,
        });
        return res.json({ message: 'Announcement deleted' });
    } catch (error) {
        console.error('Delete announcement failed', error);
        return res.status(400).json({ message: 'Failed to delete announcement' });
    }
};

// @desc    Stream announcement events for the current user
// @route   GET /api/announcements/stream
// @access  Private
const streamAnnouncements = async (req, res) => {
    try {
        const userContext = await getAnnouncementStreamContext(req.user);

        if (!userContext) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();

        writeStreamEvent(res, 'connected', {
            connected_at: new Date().toISOString(),
        });

        const keepAliveTimer = setInterval(() => {
            res.write(': keep-alive\n\n');
        }, 25000);

        const unsubscribe = announcementEventService.subscribeAnnouncementEvents((event) => {
            if (!isAnnouncementVisibleToUser(event.announcement, userContext)) {
                return;
            }

            writeStreamEvent(res, 'announcement', event);
        });

        let closed = false;
        const cleanup = () => {
            if (closed) return;
            closed = true;
            clearInterval(keepAliveTimer);
            unsubscribe();
            res.end();
        };

        req.on('close', cleanup);
        req.on('end', cleanup);
    } catch (error) {
        console.error('Announcement stream failed', error);
        if (!res.headersSent) {
            return res.status(400).json({ message: 'Failed to start announcement stream' });
        }
        res.end();
    }
};

module.exports = {
    createAnnouncement,
    getManageAnnouncements,
    getStudentAnnouncements,
    deleteAnnouncement,
    streamAnnouncements,
};
