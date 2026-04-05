const test = require('node:test');
const assert = require('node:assert/strict');

const announcementController = require('../controllers/announcementController');
const Announcement = require('../models/Announcement');
const Enrollment = require('../models/Enrollment');

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

    stubMethod(t, Announcement, 'find', (query) => {
        capturedQuery = query;
        return createQueryChain([
            { _id: 'announcement-1', title: 'Update' },
        ], ['sort', 'populate']);
    });

    const req = { user: { _id: 'student-1', role: 'STUDENT' } };
    const res = createMockResponse();

    await announcementController.getStudentAnnouncements(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [{ _id: 'announcement-1', title: 'Update' }]);
    assert.deepEqual(capturedQuery, {
        $or: [
            { audience_type: 'GLOBAL' },
            { audience_type: 'COURSE', course_id: { $in: ['course-1', 'course-2'] } },
        ],
    });
});

test('getManageAnnouncements scopes instructors to their own announcements', async (t) => {
    let capturedQuery = null;

    stubMethod(t, Announcement, 'find', (query) => {
        capturedQuery = query;
        return createQueryChain([], ['sort', 'populate']);
    });

    const req = { user: { _id: 'teacher-1', role: 'INSTRUCTOR' } };
    const res = createMockResponse();

    await announcementController.getManageAnnouncements(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(capturedQuery, { created_by: 'teacher-1' });
});
