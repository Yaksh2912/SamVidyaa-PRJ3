const test = require('node:test');
const assert = require('node:assert/strict');

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const User = require('../models/User');

const { createMockResponse, stubMethod } = require('./testUtils');

test('registerUser always creates a STUDENT account for public signup', async (t) => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

    const req = {
        body: {
            name: 'Asha',
            email: 'asha@example.com',
            password: 'secret123',
            role: 'ADMIN',
        },
    };
    const res = createMockResponse();
    const capturedUsers = [];

    stubMethod(t, User, 'findOne', async (query) => {
        if (query.email === 'asha@example.com') return null;
        if (query.username === 'asha') return null;
        return null;
    });

    stubMethod(t, User, 'create', async (payload) => {
        capturedUsers.push(payload);
        return {
            _id: 'user-1',
            ...payload,
        };
    });

    await authController.registerUser(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(capturedUsers.length, 1);
    assert.equal(capturedUsers[0].role, 'STUDENT');
    assert.equal(res.body.role, 'STUDENT');
});

test('createPrivilegedUser rejects student role requests', async () => {
    const req = {
        user: { _id: 'admin-1', role: 'ADMIN' },
        body: {
            name: 'Teacher',
            email: 'teacher@example.com',
            password: 'secret123',
            role: 'STUDENT',
        },
    };
    const res = createMockResponse();

    await userController.createPrivilegedUser(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: 'Only instructor or admin accounts can be created here' });
});
