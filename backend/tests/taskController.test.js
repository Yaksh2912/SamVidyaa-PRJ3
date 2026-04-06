const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const taskController = require('../controllers/taskController');
const Task = require('../models/Task');
const Module = require('../models/Module');
const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');
const StudentProgress = require('../models/StudentProgress');
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

test('completeTask writes points, progress, and history in a MongoDB transaction', async (t) => {
    const fakeSession = {
        ended: false,
        async withTransaction(work) {
            return work();
        },
        async endSession() {
            this.ended = true;
        },
    };

    stubMethod(t, mongoose, 'startSession', async () => fakeSession);
    stubMethod(t, Task, 'findById', () => createLeanQuery({
        _id: 'task-1',
        module_id: 'module-1',
        task_name: 'Loop Practice',
        points: 10,
        allow_collaboration: false,
        has_deadline: false,
    }));
    stubMethod(t, Module, 'findById', () => createPopulateLeanQuery({
        _id: 'module-1',
        module_name: 'Module 1',
        course_id: { _id: 'course-1', course_name: 'Algorithms' },
    }));
    stubMethod(t, Enrollment, 'findOne', () => createSelectLeanQuery({ _id: 'enrollment-1', status: 'ACTIVE' }));
    stubMethod(t, TaskCompletion, 'findOne', () => createSelectLeanQuery(null));
    stubMethod(t, DesktopTaskResult, 'findOne', () => createQueryChain({ _id: 'desktop-result-1', submitted_at: new Date('2026-04-06T10:00:00.000Z') }, ['sort']));

    let userSaveSession = null;
    stubMethod(t, User, 'findById', async () => ({
        _id: 'student-1',
        points: 20,
        async save(options = {}) {
            userSaveSession = options.session;
            return this;
        },
    }));

    let progressSaveSession = null;
    stubMethod(t, StudentProgress, 'findOneAndUpdate', async () => ({
        completed_tasks: 0,
        module_status: 'NOT_STARTED',
        can_attempt_module_test: false,
        async save(options = {}) {
            progressSaveSession = options.session;
            return this;
        },
    }));

    let transactionCreateOptions = null;
    stubMethod(t, PointTransaction, 'create', async (docs, options = {}) => {
        transactionCreateOptions = options;
        return [{ _id: 'txn-1', ...docs[0] }];
    });
    stubMethod(t, TaskCompletion, 'create', async (docs, options = {}) => {
        transactionCreateOptions = options;
        return [{ _id: 'completion-1', ...docs[0] }];
    });
    stubMethod(t, Task, 'countDocuments', () => ({
        session() {
            return 1;
        },
    }));

    const req = {
        params: { id: 'task-1' },
        body: {},
        user: { _id: 'student-1', role: 'STUDENT' },
    };
    const res = createMockResponse();

    await taskController.completeTask(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.points, 30);
    assert.equal(res.body.completion._id, 'completion-1');
    assert.equal(userSaveSession, fakeSession);
    assert.equal(progressSaveSession, fakeSession);
    assert.equal(transactionCreateOptions.session, fakeSession);
    assert.equal(fakeSession.ended, true);
});
