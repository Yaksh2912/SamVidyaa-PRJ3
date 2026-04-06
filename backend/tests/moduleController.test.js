const test = require('node:test');
const assert = require('node:assert/strict');

const moduleController = require('../controllers/moduleController');
const Course = require('../models/Course');
const Module = require('../models/Module');

const { createMockResponse, stubMethod } = require('./testUtils');

test('createModule rejects instructors writing to another instructor course', async (t) => {
    stubMethod(t, Course, 'findById', () => ({
        select: async () => ({
            _id: 'course-1',
            instructor: 'teacher-2',
        }),
    }));

    const req = {
        body: {
            course_id: 'course-1',
            module_name: 'Loops',
        },
        files: [],
        user: {
            _id: 'teacher-1',
            role: 'INSTRUCTOR',
        },
    };
    const res = createMockResponse();

    await moduleController.createModule(req, res);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: 'Not authorized' });
});

test('createModule allows the course owner to create a module', async (t) => {
    let createdPayload = null;

    stubMethod(t, Course, 'findById', () => ({
        select: async () => ({
            _id: 'course-1',
            instructor: {
                toString() {
                    return 'teacher-1';
                },
            },
        }),
    }));
    stubMethod(t, Module, 'findOne', () => ({
        sort() {
            return this;
        },
        select: async () => ({
            module_order: 2,
        }),
    }));
    stubMethod(t, Module, 'create', async (payload) => {
        createdPayload = payload;
        return { _id: 'module-1', ...payload };
    });

    const req = {
        body: {
            course_id: 'course-1',
            module_name: 'Loops',
            description: 'Iteration basics',
        },
        files: [],
        user: {
            _id: 'teacher-1',
            role: 'INSTRUCTOR',
        },
    };
    const res = createMockResponse();

    await moduleController.createModule(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(createdPayload.course_id, 'course-1');
    assert.equal(createdPayload.createdBy, 'teacher-1');
    assert.equal(createdPayload.module_order, 3);
});

test('updateModule rejects a creator when they do not own the parent course', async (t) => {
    stubMethod(t, Module, 'findById', () => ({
        populate: async () => ({
            _id: 'module-1',
            module_name: 'Loops',
            createdBy: {
                toString() {
                    return 'teacher-1';
                },
            },
            course_id: {
                instructor: {
                    toString() {
                        return 'teacher-2';
                    },
                },
            },
            save: async function save() {
                return this;
            },
        }),
    }));

    const req = {
        params: { id: 'module-1' },
        body: { module_name: 'Updated Loops' },
        files: [],
        user: {
            _id: 'teacher-1',
            role: 'INSTRUCTOR',
        },
    };
    const res = createMockResponse();

    await moduleController.updateModule(req, res);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: 'Not authorized' });
});
