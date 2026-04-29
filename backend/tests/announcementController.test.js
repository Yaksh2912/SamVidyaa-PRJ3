const test = require('node:test');
const assert = require('node:assert/strict');

const announcementController = require('../controllers/announcementController');
const Announcement = require('../models/Announcement');
const Enrollment = require('../models/Enrollment');
const announcementEvents = require('../services/announcementEventService');
const announcementExpiryService = require('../services/announcementExpiryService');

const {
    createMockResponse,
    stubMethod,
    createQueryChain,
    createSelectLeanQuery,
} = require('./testUtils');

test('getStudentAnnouncements rejects non-student users', async () => {
    const req = { user: { _id: 'teacher-1', role: 'INSTRUCTOR' } };
    const res = createMockResponse();

    await announcementController.getStudentAnnouncements(req, res);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: 'Not authorized' });
});

test('getStudentAnnouncements fetches global and enrolled-course announcements', async (t) => {
    let capturedQuery = null;

    stubMethod(t, Enrollment, 'find', () => createSelectLeanQuery([
        { course_id: 'course-1' },
        { course_id: 'course-2' },
    ]));
    stubMethod(t, Announcement, 'countDocuments', async () => 1);

    stubMethod(t, Announcement, 'find', (query) => {
        capturedQuery = query;
        return createQueryChain([
            { _id: 'announcement-1', title: 'Update' },
        ], ['sort', 'populate', 'skip', 'limit']);
    });

    const req = { user: { _id: 'student-1', role: 'STUDENT' } };
    const res = createMockResponse();

    await announcementController.getStudentAnnouncements(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [{ _id: 'announcement-1', title: 'Update' }]);
    assert.equal(res.getHeader('x-total-count'), '1');
    assert.deepEqual(capturedQuery, {
        $and: [
            {
                $or: [
                    { audience_type: 'GLOBAL' },
                    { audience_type: 'COURSE', course_id: { $in: ['course-1', 'course-2'] } },
                ],
            },
            {
                $or: [
                    { expires_at: null },
                    { expires_at: { $gt: capturedQuery.$and[1].$or[1].expires_at.$gt } },
                ],
            },
        ],
    });
});

test('getManageAnnouncements scopes instructors to their own announcements', async (t) => {
    let capturedQuery = null;

    stubMethod(t, Announcement, 'countDocuments', async () => 0);
    stubMethod(t, Announcement, 'find', (query) => {
        capturedQuery = query;
        return createQueryChain([], ['sort', 'populate', 'skip', 'limit']);
    });

    const req = { user: { _id: 'teacher-1', role: 'INSTRUCTOR' } };
    const res = createMockResponse();

    await announcementController.getManageAnnouncements(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.getHeader('x-total-count'), '0');
    assert.deepEqual(capturedQuery, {
        $and: [
            { created_by: 'teacher-1' },
            {
                $or: [
                    { expires_at: null },
                    { expires_at: { $gt: capturedQuery.$and[1].$or[1].expires_at.$gt } },
                ],
            },
        ],
    });
});

test('createAnnouncement stores expiry and emits realtime updates', async (t) => {
    let createdPayload = null;
    let scheduledAnnouncement = null;
    let publishedEvent = null;

    stubMethod(t, Announcement, 'create', async (payload) => {
        createdPayload = payload;
        return {
            ...payload,
            _id: 'announcement-1',
            populate: async () => ({
                _id: 'announcement-1',
                ...payload,
                created_by: { _id: payload.created_by, name: 'Admin User' },
            }),
        };
    });
    stubMethod(t, announcementExpiryService, 'scheduleAnnouncementExpiry', (announcement) => {
        scheduledAnnouncement = announcement;
    });
    stubMethod(t, announcementEvents, 'publishAnnouncementEvent', (event) => {
        publishedEvent = event;
    });

    const req = {
        user: { _id: 'admin-1', role: 'ADMIN' },
        body: {
            audience_type: 'GLOBAL',
            title: 'Heads up',
            message: 'Lab closes early',
            expires_in_minutes: 15,
        },
    };
    const res = createMockResponse();

    await announcementController.createAnnouncement(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(createdPayload.title, 'Heads up');
    assert.equal(createdPayload.message, 'Lab closes early');
    assert.equal(createdPayload.audience_type, 'GLOBAL');
    assert.equal(createdPayload.course_id, null);
    assert.ok(createdPayload.expires_at instanceof Date);
    assert.equal(scheduledAnnouncement._id, 'announcement-1');
    assert.equal(publishedEvent.type, 'created');
    assert.equal(publishedEvent.announcement._id, 'announcement-1');
    assert.deepEqual(publishedEvent.announcement.created_by, { _id: 'admin-1', name: 'Admin User' });
});

test('createAnnouncement allows instructors to publish all-student announcements', async (t) => {
    let createdPayload = null;

    stubMethod(t, Announcement, 'create', async (payload) => {
        createdPayload = payload;
        return {
            ...payload,
            _id: 'announcement-2',
            populate: async () => ({
                _id: 'announcement-2',
                ...payload,
                created_by: { _id: payload.created_by, name: 'Teacher User' },
            }),
        };
    });
    stubMethod(t, announcementExpiryService, 'scheduleAnnouncementExpiry', () => {});
    stubMethod(t, announcementEvents, 'publishAnnouncementEvent', () => {});

    const req = {
        user: { _id: 'teacher-1', role: 'INSTRUCTOR' },
        body: {
            audience_type: 'GLOBAL',
            title: 'Campus notice',
            message: 'The lab opens early tomorrow',
        },
    };
    const res = createMockResponse();

    await announcementController.createAnnouncement(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(createdPayload.audience_type, 'GLOBAL');
    assert.equal(createdPayload.course_id, null);
});
