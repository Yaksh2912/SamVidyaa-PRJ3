const test = require('node:test');
const assert = require('node:assert/strict');

const enrollmentController = require('../controllers/enrollmentController');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const {
    createMockResponse,
    stubMethod,
    createLeanQuery,
    createSelectLeanQuery,
} = require('./testUtils');

test('bulkEnrollByEmail reports exact enrolled and skipped counts under concurrent-like outcomes', async (t) => {
    stubMethod(t, Course, 'findById', async () => ({
        _id: 'course-1',
        instructor: 'teacher-1',
    }));

    stubMethod(t, User, 'find', () => ({
        select() {
            return this;
        },
        lean: async () => ([
            { _id: 'student-a', email: 'a@example.com' },
            { _id: 'student-b', email: 'b@example.com' },
            { _id: 'student-c', email: 'c@example.com' },
            { _id: 'student-d', email: 'd@example.com' },
        ]),
    }));

    stubMethod(t, Enrollment, 'find', () => createSelectLeanQuery([
        { _id: 'enroll-a', student_id: 'student-a', status: 'ACTIVE' },
        { _id: 'enroll-b', student_id: 'student-b', status: 'DROPPED' },
    ]));

    stubMethod(t, Enrollment, 'updateMany', async () => ({ modifiedCount: 1 }));
    stubMethod(t, Enrollment, 'bulkWrite', async () => ({ upsertedCount: 1 }));

    const req = {
        body: {
            course_id: 'course-1',
            student_emails: [
                'a@example.com',
                'b@example.com',
                'c@example.com',
                'd@example.com',
                'missing@example.com',
            ],
        },
        user: {
            _id: 'admin-1',
            role: 'ADMIN',
        },
    };
    const res = createMockResponse();

    await enrollmentController.bulkEnrollByEmail(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
        message: 'Email enrollment processed',
        enrolled: 2,
        skipped: 2,
        not_found: 1,
        invalid: 0,
        total_processed: 5,
    });
});

test('bulkEnrollByRange returns zero changes when no matching students are provided', async (t) => {
    stubMethod(t, User, 'find', () => ({
        select() {
            return this;
        },
        then(resolve) {
            return Promise.resolve([]).then(resolve);
        },
        catch(reject) {
            return Promise.resolve([]).catch(reject);
        },
    }));

    const req = {
        body: {
            course_id: 'course-1',
            start_enrollment: '100',
            end_enrollment: '101',
        },
    };
    const res = createMockResponse();

    await enrollmentController.bulkEnrollByRange(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: 'No students found in the given enrollment number range' });
});
