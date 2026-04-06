const test = require('node:test');
const assert = require('node:assert/strict');

const taskController = require('../controllers/taskController');
const Task = require('../models/Task');
const Module = require('../models/Module');
const User = require('../models/User');
const TaskCompletion = require('../models/TaskCompletion');
const DesktopTaskResult = require('../models/DesktopTaskResult');
const Enrollment = require('../models/Enrollment');

const {
    createMockResponse,
    stubMethod,
    createLeanQuery,
    createSelectLeanQuery,
    createPopulateLeanQuery,
    createQueryChain,
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
    stubMethod(t, Enrollment, 'findOne', () => createSelectLeanQuery({ _id: 'enrollment-1', status: 'ACTIVE' }));
    stubMethod(t, TaskCompletion, 'findOne', () => createSelectLeanQuery({ _id: 'completion-1' }));
    stubMethod(t, DesktopTaskResult, 'findOne', () => createQueryChain({ _id: 'desktop-result-1', submitted_at: new Date() }, ['sort']));

    const req = {
        params: { id: 'task-1' },
        body: { collaboratorIds: [] },
        user: { _id: 'student-1', role: 'STUDENT' },
    };
    const res = createMockResponse();

    await taskController.completeTask(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: 'Task already completed' });
});

test('completeTask rejects non-student users', async () => {
    const req = {
        params: { id: 'task-1' },
        body: {},
        user: { _id: 'teacher-1', role: 'INSTRUCTOR' },
    };
    const res = createMockResponse();

    await taskController.completeTask(req, res);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: 'Only students can complete tasks' });
});

test('completeTask rejects students without active enrollment', async (t) => {
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
    stubMethod(t, Enrollment, 'findOne', () => createSelectLeanQuery(null));

    const req = {
        params: { id: 'task-1' },
        body: {},
        user: { _id: 'student-1', role: 'STUDENT' },
    };
    const res = createMockResponse();

    await taskController.completeTask(req, res);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { message: 'You are not allowed to complete tasks for this course' });
});

test('completeTask rejects completion when no passed desktop result exists', async (t) => {
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
    stubMethod(t, Enrollment, 'findOne', () => createSelectLeanQuery({ _id: 'enrollment-1', status: 'ACTIVE' }));
    stubMethod(t, TaskCompletion, 'findOne', () => createSelectLeanQuery(null));
    stubMethod(t, DesktopTaskResult, 'findOne', () => createQueryChain(null, ['sort']));

    const req = {
        params: { id: 'task-1' },
        body: {},
        user: { _id: 'student-1', role: 'STUDENT' },
    };
    const res = createMockResponse();

    await taskController.completeTask(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: 'Task must be completed in the desktop application before validation' });
});

test('recordDesktopTaskResult stores a passed result for enrolled students', async (t) => {
    stubMethod(t, Task, 'findById', () => createLeanQuery({
        _id: 'task-1',
        module_id: 'module-1',
        task_name: 'Loop Practice',
        points: 10,
    }));
    stubMethod(t, Module, 'findById', () => createPopulateLeanQuery({
        _id: 'module-1',
        module_name: 'Module 1',
        course_id: { _id: 'course-1', course_name: 'Algorithms' },
    }));
    stubMethod(t, Enrollment, 'findOne', () => createSelectLeanQuery({ _id: 'enrollment-1', status: 'ACTIVE' }));

    let createdPayload = null;
    stubMethod(t, DesktopTaskResult, 'create', async (payload) => {
        createdPayload = payload;
        return { _id: 'result-1', ...payload };
    });

    const req = {
        params: { id: 'task-1' },
        body: {
            status: 'PASSED',
            passed_test_cases: 4,
            total_test_cases: 4,
            execution_ref: 'exec-1',
        },
        user: { _id: 'student-1', role: 'STUDENT' },
    };
    const res = createMockResponse();

    await taskController.recordDesktopTaskResult(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(createdPayload.status, 'PASSED');
    assert.equal(createdPayload.student_id, 'student-1');
    assert.equal(createdPayload.task_id, 'task-1');
});
