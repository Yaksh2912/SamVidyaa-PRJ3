const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { createApp } = require('../app');
const User = require('../models/User');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Task = require('../models/Task');
const Enrollment = require('../models/Enrollment');
const DesktopTaskResult = require('../models/DesktopTaskResult');
const TaskCompletion = require('../models/TaskCompletion');
const PointTransaction = require('../models/PointTransaction');
const StudentProgress = require('../models/StudentProgress');
const {
    stubMethod,
    createAwaitableQuery,
    createSelectLeanQuery,
    createQueryChain,
    startTestServer,
} = require('./testUtils');

const TEST_JWT_SECRET = 'integration-test-secret';

const IDS = {
    student: '507f1f77bcf86cd799439011',
    instructor: '507f1f77bcf86cd799439012',
    otherInstructor: '507f1f77bcf86cd799439013',
    module: '507f1f77bcf86cd799439021',
    course: '507f1f77bcf86cd799439022',
    task: '507f1f77bcf86cd799439023',
};

const createToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

const withJwtSecret = (t) => {
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    t.after(() => {
        if (previousSecret === undefined) {
            delete process.env.JWT_SECRET;
            return;
        }

        process.env.JWT_SECRET = previousSecret;
    });
};

const createUserQuery = (user) => createAwaitableQuery(user, ['select', 'session']);
const createModuleQuery = (module) => createAwaitableQuery(module, ['populate', 'select', 'session']);
const createCourseQuery = (course) => createAwaitableQuery(course, ['select', 'session']);

test('POST /api/auth/register always creates a STUDENT account even when a privileged role is submitted', async (t) => {
    withJwtSecret(t);

    let createdPayload = null;

    stubMethod(t, User, 'findOne', async (query) => {
        if (query.email === 'privileged@example.com') return null;
        if (query.username === 'privileged') return null;
        return null;
    });
    stubMethod(t, User, 'create', async (payload) => {
        createdPayload = payload;
        return {
            _id: IDS.student,
            name: payload.name,
            username: payload.username,
            email: payload.email,
            role: payload.role,
            institution: payload.institution,
        };
    });

    const testServer = await startTestServer(createApp());
    t.after(() => testServer.close());

    const response = await testServer.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Privileged User',
            email: 'privileged@example.com',
            password: 'password123',
            role: 'ADMIN',
        }),
    });

    assert.equal(response.status, 201);

    const body = await response.json();
    assert.equal(body.role, 'STUDENT');
    assert.equal(createdPayload.role, 'STUDENT');
});

test('health endpoint returns a request correlation id header', async (t) => {
    const testServer = await startTestServer(createApp());
    t.after(() => testServer.close());

    const response = await testServer.request('/health');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.ok(response.headers['x-request-id']);
});

test('write routes block student users and enforce instructor ownership through the real router stack', async (t) => {
    withJwtSecret(t);

    stubMethod(t, User, 'findById', (id) => {
        if (String(id) === IDS.student) {
            return createUserQuery({ _id: IDS.student, role: 'STUDENT', name: 'Student User' });
        }

        if (String(id) === IDS.instructor) {
            return createUserQuery({ _id: IDS.instructor, role: 'INSTRUCTOR', name: 'Instructor User' });
        }

        return createUserQuery(null);
    });
    stubMethod(t, Module, 'findById', () => createModuleQuery({
        _id: IDS.module,
        module_name: 'Ownership Protected Module',
        course_id: {
            instructor: {
                toString() {
                    return IDS.otherInstructor;
                },
            },
        },
        save: async function save() {
            return this;
        },
    }));

    const testServer = await startTestServer(createApp());
    t.after(() => testServer.close());

    const studentResponse = await testServer.request('/api/modules', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${createToken(IDS.student)}`,
        },
        body: JSON.stringify({
            course_id: IDS.course,
            module_name: 'Unauthorized Module',
        }),
    });

    assert.equal(studentResponse.status, 401);
    assert.deepEqual(await studentResponse.json(), { message: 'Not authorized as an instructor or admin' });

    const instructorResponse = await testServer.request(`/api/modules/${IDS.module}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${createToken(IDS.instructor)}`,
        },
        body: JSON.stringify({
            module_name: 'Still Not Yours',
        }),
    });

    assert.equal(instructorResponse.status, 401);
    assert.deepEqual(await instructorResponse.json(), { message: 'Not authorized' });
});

test('protected file access only succeeds for authorized users through the file route', async (t) => {
    withJwtSecret(t);

    const uploadsDir = path.join(__dirname, '..', 'uploads', 'integration-tests');
    const relativePath = path.posix.join('uploads', 'integration-tests', 'protected.txt');
    const absolutePath = path.join(uploadsDir, 'protected.txt');
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    await fs.promises.writeFile(absolutePath, 'protected-content', 'utf8');
    t.after(async () => {
        await fs.promises.rm(uploadsDir, { recursive: true, force: true });
    });

    let enrollmentActive = false;

    stubMethod(t, User, 'findById', () => createUserQuery({ _id: IDS.student, role: 'STUDENT', name: 'Student User' }));
    stubMethod(t, Course, 'findOne', () => createCourseQuery(null));
    stubMethod(t, Module, 'findOne', () => createModuleQuery({
        _id: IDS.module,
        createdBy: IDS.instructor,
        course_id: {
            _id: IDS.course,
            instructor: {
                toString() {
                    return IDS.instructor;
                },
            },
        },
        files: [{ path: relativePath, name: 'protected.txt' }],
    }));
    stubMethod(t, Enrollment, 'findOne', () => createSelectLeanQuery(enrollmentActive ? { _id: 'enrollment-1' } : null));

    const testServer = await startTestServer(createApp());
    t.after(() => testServer.close());

    const blockedResponse = await testServer.request(`/api/files?path=${encodeURIComponent(relativePath)}`, {
        headers: {
            Authorization: `Bearer ${createToken(IDS.student)}`,
        },
    });

    assert.equal(blockedResponse.status, 403);
    assert.deepEqual(await blockedResponse.json(), { message: 'Not authorized to access this file' });

    enrollmentActive = true;

    const allowedResponse = await testServer.request(`/api/files?path=${encodeURIComponent(relativePath)}`, {
        headers: {
            Authorization: `Bearer ${createToken(IDS.student)}`,
        },
    });

    assert.equal(allowedResponse.status, 200);
    assert.match(allowedResponse.headers['content-disposition'], /^attachment;/);
    assert.equal(await allowedResponse.text(), 'protected-content');
});

test('desktop-result submission and task completion work together through the real routes', async (t) => {
    withJwtSecret(t);

    let currentPoints = 5;
    let savedDesktopResult = null;
    let savedCompletion = null;

    stubMethod(t, User, 'findById', () => createUserQuery({
        _id: IDS.student,
        role: 'STUDENT',
        name: 'Student User',
        points: currentPoints,
        async save() {
            currentPoints = this.points;
            return this;
        },
    }));
    stubMethod(t, Task, 'findById', () => createAwaitableQuery({
        _id: IDS.task,
        module_id: IDS.module,
        task_name: 'Integration Task',
        points: 10,
        allow_collaboration: false,
        has_deadline: false,
        difficulty: 'MEDIUM',
        language: 'Python',
        time_limit: 30,
    }, ['session']));
    stubMethod(t, Module, 'findById', () => createAwaitableQuery({
        _id: IDS.module,
        module_name: 'Integration Module',
        course_id: { _id: IDS.course, course_name: 'Integration Course' },
    }, ['populate', 'session']));
    stubMethod(t, Enrollment, 'findOne', () => createSelectLeanQuery({ _id: 'enrollment-1', status: 'ACTIVE' }));
    stubMethod(t, DesktopTaskResult, 'create', async (payload) => {
        savedDesktopResult = { _id: 'result-1', ...payload };
        return savedDesktopResult;
    });
    stubMethod(t, DesktopTaskResult, 'findOne', () => createQueryChain(savedDesktopResult, ['sort', 'session']));
    stubMethod(t, TaskCompletion, 'findOne', () => createSelectLeanQuery(savedCompletion ? { _id: savedCompletion._id } : null));
    stubMethod(t, TaskCompletion, 'create', async (docs) => {
        savedCompletion = { _id: 'completion-1', ...docs[0] };
        return [savedCompletion];
    });
    stubMethod(t, PointTransaction, 'create', async (docs) => [{ _id: 'txn-1', ...docs[0] }]);
    stubMethod(t, StudentProgress, 'findOneAndUpdate', async () => ({
        completed_tasks: 0,
        module_status: 'NOT_STARTED',
        can_attempt_module_test: false,
        async save() {
            return this;
        },
    }));
    stubMethod(t, Task, 'countDocuments', () => createAwaitableQuery(1, ['session']));
    stubMethod(t, mongoose, 'startSession', async () => ({
        async withTransaction(work) {
            return work();
        },
        async endSession() {
            return undefined;
        },
    }));

    const testServer = await startTestServer(createApp());
    t.after(() => testServer.close());

    const desktopResultResponse = await testServer.request(`/api/tasks/${IDS.task}/desktop-result`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${createToken(IDS.student)}`,
        },
        body: JSON.stringify({
            status: 'PASSED',
            passed_test_cases: 3,
            total_test_cases: 3,
            execution_ref: 'integration-exec-1',
        }),
    });

    assert.equal(desktopResultResponse.status, 201);
    assert.equal((await desktopResultResponse.json()).message, 'Desktop result recorded and ready for validation');

    const completionResponse = await testServer.request(`/api/tasks/${IDS.task}/complete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${createToken(IDS.student)}`,
        },
        body: JSON.stringify({ collaboratorIds: [] }),
    });

    assert.equal(completionResponse.status, 200);

    const completionBody = await completionResponse.json();
    assert.equal(completionBody.points, 15);
    assert.equal(completionBody.completion.task_id, IDS.task);
    assert.equal(savedCompletion.points_awarded, 10);
});

test('task completion rolls back partial writes against a real transactional MongoDB setup', async (t) => {
    const transactionalMongoUri = process.env.TEST_MONGO_URI;
    if (!transactionalMongoUri) {
        t.skip('TEST_MONGO_URI is not configured');
        return;
    }

    withJwtSecret(t);

    await mongoose.connect(transactionalMongoUri);
    t.after(async () => {
        await mongoose.disconnect();
    });

    const createdIds = [];
    const trackDocument = (document) => {
        createdIds.push(document._id);
        return document;
    };

    const instructor = trackDocument(await User.create({
        username: `teacher_${Date.now()}`,
        name: 'Transactional Teacher',
        email: `teacher_${Date.now()}@example.com`,
        password: 'password123',
        role: 'INSTRUCTOR',
    }));
    const student = trackDocument(await User.create({
        username: `student_${Date.now()}`,
        name: 'Transactional Student',
        email: `student_${Date.now()}@example.com`,
        password: 'password123',
        role: 'STUDENT',
    }));
    const course = trackDocument(await Course.create({
        course_code: `TXN${Date.now()}`,
        course_name: 'Transactional Course',
        subject: 'Testing',
        instructor: instructor._id,
    }));
    const moduleRecord = trackDocument(await Module.create({
        course_id: course._id,
        module_name: 'Transactional Module',
        module_order: 1,
        createdBy: instructor._id,
    }));
    const task = trackDocument(await Task.create({
        module_id: moduleRecord._id,
        task_name: 'Transactional Task',
        problem_statement: 'Solve the task',
        points: 25,
        allow_collaboration: false,
    }));
    trackDocument(await Enrollment.create({
        course_id: course._id,
        student_id: student._id,
        status: 'ACTIVE',
    }));
    trackDocument(await DesktopTaskResult.create({
        student_id: student._id,
        course_id: course._id,
        module_id: moduleRecord._id,
        task_id: task._id,
        status: 'PASSED',
        passed_test_cases: 2,
        total_test_cases: 2,
        execution_ref: `txn-exec-${Date.now()}`,
    }));

    stubMethod(t, TaskCompletion, 'create', async () => {
        throw new Error('Forced transactional failure');
    });

    const testServer = await startTestServer(createApp());
    t.after(() => testServer.close());

    const response = await testServer.request(`/api/tasks/${task._id.toString()}/complete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${createToken(student._id.toString())}`,
        },
        body: JSON.stringify({ collaboratorIds: [] }),
    });

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { message: 'Failed to complete task' });

    const [reloadedStudent, pointTransactions, progressRecord, completionRecord] = await Promise.all([
        User.findById(student._id).lean(),
        PointTransaction.find({ user_id: student._id }).lean(),
        StudentProgress.findOne({ student_id: student._id, module_id: moduleRecord._id }).lean(),
        TaskCompletion.findOne({ student_id: student._id, task_id: task._id }).lean(),
    ]);

    assert.equal(reloadedStudent.points || 0, 0);
    assert.equal(pointTransactions.length, 0);
    assert.equal(progressRecord, null);
    assert.equal(completionRecord, null);

    t.after(async () => {
        await Promise.all([
            DesktopTaskResult.deleteMany({ _id: { $in: createdIds } }),
            Enrollment.deleteMany({ _id: { $in: createdIds } }),
            Task.deleteMany({ _id: { $in: createdIds } }),
            Module.deleteMany({ _id: { $in: createdIds } }),
            Course.deleteMany({ _id: { $in: createdIds } }),
            User.deleteMany({ _id: { $in: createdIds } }),
            PointTransaction.deleteMany({ course_id: course._id }),
            StudentProgress.deleteMany({ course_id: course._id }),
            TaskCompletion.deleteMany({ course_id: course._id }),
        ]);
    });
});
