const test = require('node:test');
const assert = require('node:assert/strict');

const taskController = require('../controllers/taskController');
const Task = require('../models/Task');
const Module = require('../models/Module');
const User = require('../models/User');
const TaskCompletion = require('../models/TaskCompletion');

const {
    createMockResponse,
    stubMethod,
    createLeanQuery,
    createSelectLeanQuery,
    createPopulateLeanQuery,
} = require('./testUtils');

test('getTasks excludes completed tasks for students', async (t) => {
    let capturedQuery = null;

    stubMethod(t, TaskCompletion, 'distinct', async () => ['task-completed']);
    stubMethod(t, Task, 'find', (query) => {
        capturedQuery = query;
        return createLeanQuery([{ _id: 'task-open' }]);
    });

    const req = {
        query: { module_id: 'module-1' },
        user: { _id: 'student-1', role: 'STUDENT' },
    };
    const res = createMockResponse();

    await taskController.getTasks(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [{ _id: 'task-open' }]);
    assert.deepEqual(capturedQuery, {
        module_id: 'module-1',
        _id: { $nin: ['task-completed'] },
    });
});

test('getTasks does not exclude tasks for non-student roles', async (t) => {
    let capturedQuery = null;

    stubMethod(t, Task, 'find', (query) => {
        capturedQuery = query;
        return createLeanQuery([{ _id: 'task-1' }, { _id: 'task-2' }]);
    });

    const req = {
        query: { module_id: 'module-2' },
        user: { _id: 'teacher-1', role: 'INSTRUCTOR' },
    };
    const res = createMockResponse();

    await taskController.getTasks(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [{ _id: 'task-1' }, { _id: 'task-2' }]);
    assert.deepEqual(capturedQuery, { module_id: 'module-2' });
});

test('completeTask rejects duplicate completions before awarding points', async (t) => {
    let userLookupCalled = false;

    stubMethod(t, Task, 'findById', () => createLeanQuery({
        _id: 'task-1',
        module_id: 'module-1',
        task_name: 'Loop Practice',
        points: 10,
        allow_collaboration: false,
    }));
    stubMethod(t, Module, 'findById', () => createPopulateLeanQuery({
        _id: 'module-1',
        module_name: 'Module 1',
        course_id: { _id: 'course-1', course_name: 'Algorithms' },
    }));
    stubMethod(t, TaskCompletion, 'findOne', () => createSelectLeanQuery({ _id: 'completion-1' }));
    stubMethod(t, User, 'findById', async () => {
        userLookupCalled = true;
        return null;
    });

    const req = {
        params: { id: 'task-1' },
        body: { collaboratorIds: [] },
        user: { _id: 'student-1', role: 'STUDENT' },
    };
    const res = createMockResponse();

    await taskController.completeTask(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: 'Task already completed' });
    assert.equal(userLookupCalled, false);
});
