const test = require('node:test');
const assert = require('node:assert/strict');

const courseController = require('../controllers/courseController');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const StudentProgress = require('../models/StudentProgress');
const Module = require('../models/Module');
const Task = require('../models/Task');
const TaskCompletion = require('../models/TaskCompletion');
const DesktopTaskResult = require('../models/DesktopTaskResult');

const {
    createMockResponse,
    stubMethod,
    createLeanQuery,
    createAwaitableQuery,
    createQueryChain,
} = require('./testUtils');

test('getTeacherStats returns score distribution, task hotspots, and leaderboard snapshot data', async (t) => {
    stubMethod(t, Course, 'find', () => createAwaitableQuery([
        { _id: 'course-1', course_name: 'Algorithms', course_code: 'CS101' },
    ], ['select']));
    stubMethod(t, Enrollment, 'distinct', async () => ['student-1']);
    stubMethod(t, Module, 'find', () => createAwaitableQuery([
        { _id: 'module-1', course_id: 'course-1', module_name: 'Loops', module_order: 1 },
    ], ['select']));
    stubMethod(t, Enrollment, 'find', () => createAwaitableQuery([
        {
            course_id: 'course-1',
            status: 'ACTIVE',
            student_id: {
                _id: 'student-1',
                name: 'Asha',
                email: 'asha@example.com',
                enrollment_number: 'EN001',
                points: 140,
                last_login: null,
            },
            updatedAt: new Date('2026-01-02T10:00:00.000Z'),
        },
    ], ['populate']));
    stubMethod(t, StudentProgress, 'find', () => createLeanQuery([
        {
            student_id: 'student-1',
            course_id: 'course-1',
            module_id: 'module-1',
            completed_tasks: 1,
            module_test_completed: false,
            total_score: 82,
            module_status: 'IN_PROGRESS',
            updatedAt: new Date('2026-01-03T10:00:00.000Z'),
        },
    ]));
    stubMethod(t, Task, 'find', () => createQueryChain([
        {
            _id: 'task-1',
            module_id: 'module-1',
            task_name: 'Loop Drill',
            difficulty: 'HARD',
            language: 'Python',
            points: 20,
            time_limit: 30,
        },
    ], ['select']));
    stubMethod(t, DesktopTaskResult, 'find', () => createQueryChain([
        { task_id: 'task-1', status: 'FAILED', passed_test_cases: 2, total_test_cases: 5, runtime_ms: 1800 },
        { task_id: 'task-1', status: 'PASSED', passed_test_cases: 5, total_test_cases: 5, runtime_ms: 1100 },
    ], ['select']));
    stubMethod(t, TaskCompletion, 'find', () => createQueryChain([
        { task_id: 'task-1', student_id: 'student-1' },
    ], ['select']));

    const req = { user: { _id: 'teacher-1', role: 'INSTRUCTOR' } };
    const res = createMockResponse();

    await courseController.getTeacherStats(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.performanceAnalytics.topPerformers.length, 1);
    assert.equal(res.body.performanceAnalytics.leaderboardSnapshot.topPerformers.length, 1);
    assert.equal(res.body.performanceAnalytics.taskDifficultyHotspots[0].taskName, 'Loop Drill');
    assert.equal(res.body.performanceAnalytics.courseBreakdown.length, 1);
    assert.equal(res.body.performanceAnalytics.courseBreakdown[0].courseName, 'Algorithms');
    assert.equal(res.body.performanceAnalytics.courseHighlights.strongestCourse.courseName, 'Algorithms');
    assert.equal(res.body.performanceAnalytics.scoreDistribution[4].label, '80-100');
    assert.equal(res.body.performanceAnalytics.scoreDistribution[4].value, 1);
});

test('getCourseAnalytics returns hardest task and score-band distributions', async (t) => {
    stubMethod(t, Course, 'findById', () => createAwaitableQuery({
        _id: 'course-1',
        course_name: 'Algorithms',
        course_code: 'CS101',
        subject: 'Computer Science',
        instructor: {
            _id: 'teacher-1',
            toString() {
                return 'teacher-1';
            },
        },
    }, ['populate']));
    stubMethod(t, Module, 'find', () => createAwaitableQuery([
        { _id: 'module-1', course_id: 'course-1', module_name: 'Loops', module_order: 1 },
    ], ['select', 'sort']));
    stubMethod(t, Enrollment, 'find', () => createAwaitableQuery([
        {
            course_id: 'course-1',
            status: 'ACTIVE',
            student_id: {
                _id: 'student-1',
                name: 'Asha',
                email: 'asha@example.com',
                enrollment_number: 'EN001',
                points: 140,
                last_login: null,
                createdAt: new Date('2026-01-01T10:00:00.000Z'),
            },
            createdAt: new Date('2026-01-01T10:00:00.000Z'),
            updatedAt: new Date('2026-01-03T10:00:00.000Z'),
        },
    ], ['populate']));
    stubMethod(t, StudentProgress, 'find', () => createLeanQuery([
        {
            student_id: 'student-1',
            course_id: 'course-1',
            module_id: 'module-1',
            completed_tasks: 1,
            module_test_completed: false,
            total_score: 82,
            module_status: 'IN_PROGRESS',
            updatedAt: new Date('2026-01-03T10:00:00.000Z'),
        },
    ]));
    stubMethod(t, Task, 'find', () => createQueryChain([
        {
            _id: 'task-1',
            module_id: 'module-1',
            task_name: 'Loop Drill',
            difficulty: 'HARD',
            language: 'Python',
            points: 20,
            time_limit: 30,
        },
    ], ['select']));
    stubMethod(t, DesktopTaskResult, 'find', () => createQueryChain([
        { task_id: 'task-1', status: 'FAILED', passed_test_cases: 2, total_test_cases: 5, runtime_ms: 1800 },
        { task_id: 'task-1', status: 'PASSED', passed_test_cases: 5, total_test_cases: 5, runtime_ms: 1100 },
    ], ['select']));
    stubMethod(t, TaskCompletion, 'find', () => createQueryChain([
        { task_id: 'task-1', student_id: 'student-1' },
    ], ['select']));

    const req = {
        params: { id: 'course-1' },
        user: { _id: 'teacher-1', role: 'INSTRUCTOR' },
    };
    const res = createMockResponse();

    await courseController.getCourseAnalytics(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.overview.hardestTask.taskName, 'Loop Drill');
    assert.equal(res.body.taskDifficultyHotspots.length, 1);
    assert.equal(res.body.distributions.scoreBand[4].value, 1);
});
