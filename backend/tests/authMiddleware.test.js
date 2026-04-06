const test = require('node:test');
const assert = require('node:assert/strict');

const { admin, instructorOrAdmin } = require('../middleware/authMiddleware');
const { createMockResponse } = require('./testUtils');

test('instructorOrAdmin allows instructor users', () => {
    const res = createMockResponse();
    let nextCalled = false;

    instructorOrAdmin(
        { user: { role: 'INSTRUCTOR' } },
        res,
        () => { nextCalled = true; }
    );

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
});

test('instructorOrAdmin rejects student users', () => {
    const res = createMockResponse();
    let nextCalled = false;

    instructorOrAdmin(
        { user: { role: 'STUDENT' } },
        res,
        () => { nextCalled = true; }
    );

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: 'Not authorized as an instructor or admin' });
});

test('admin allows uppercase admin users', () => {
    const res = createMockResponse();
    let nextCalled = false;

    admin(
        { user: { role: 'ADMIN' } },
        res,
        () => { nextCalled = true; }
    );

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
});
