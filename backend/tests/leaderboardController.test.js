const test = require('node:test');
const assert = require('node:assert/strict');

const leaderboardController = require('../controllers/leaderboardController');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

const {
    createMockResponse,
    stubMethod,
    createQueryChain,
    createSelectLeanQuery,
} = require('./testUtils');

test('getGlobalLeaderboard fetches top student users', async (t) => {
    let capturedQuery = null;

    stubMethod(t, User, 'find', (query) => {
        capturedQuery = query;
        return createQueryChain([{ _id: 'student-1', points: 200 }], ['select', 'sort', 'limit']);
    });

    const res = createMockResponse();

    await leaderboardController.getGlobalLeaderboard({}, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [{ _id: 'student-1', points: 200 }]);
    assert.deepEqual(capturedQuery, { role: 'STUDENT' });
});

test('getClassLeaderboard fetches classmates from enrolled student ids', async (t) => {
    let capturedUserQuery = null;

    stubMethod(t, Enrollment, 'find', () => createSelectLeanQuery([
        { student_id: 'student-1' },
        { student_id: 'student-2' },
    ]));

    stubMethod(t, User, 'find', (query) => {
        capturedUserQuery = query;
        return createQueryChain([{ _id: 'student-1' }, { _id: 'student-2' }], ['select', 'sort', 'limit']);
    });

    const req = { params: { courseId: 'course-1' } };
    const res = createMockResponse();

    await leaderboardController.getClassLeaderboard(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [{ _id: 'student-1' }, { _id: 'student-2' }]);
    assert.deepEqual(capturedUserQuery, {
        _id: { $in: ['student-1', 'student-2'] },
    });
});
