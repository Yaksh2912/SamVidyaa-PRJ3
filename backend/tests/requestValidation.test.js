const test = require('node:test');
const assert = require('node:assert/strict');

const {
    handleUploadMiddleware,
    validateRegisterRequest,
    validateModuleCreateRequest,
    validateTaskCreateRequest,
    validateDesktopResultRequest,
    validateAnnouncementCreateRequest,
} = require('../middleware/requestValidation');
const { createMockResponse } = require('./testUtils');

const runMiddleware = async (middleware, req) => {
    const res = createMockResponse();
    let nextCalled = false;

    await middleware(req, res, () => {
        nextCalled = true;
    });

    return { res, nextCalled };
};

test('validateRegisterRequest returns standardized field errors', async () => {
    const { res, nextCalled } = await runMiddleware(validateRegisterRequest, {
        body: {
            name: '',
            email: 'invalid-email',
            password: '123',
        },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Validation failed');
    assert.equal(res.body.errors.name, 'name is required');
    assert.equal(res.body.errors.email, 'email must be a valid email address');
    assert.equal(res.body.errors.password, 'password must be at least 6 characters');
});

test('validateTaskCreateRequest rejects invalid task payloads', async () => {
    const { res, nextCalled } = await runMiddleware(validateTaskCreateRequest, {
        body: {
            module_id: 'bad-id',
            task_name: '',
            problem_statement: '',
            collab_percentage: 150,
            time_limit: 0,
            difficulty: 'IMPOSSIBLE',
        },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Validation failed');
    assert.equal(res.body.errors.module_id, 'module_id must be a valid id');
    assert.equal(res.body.errors.task_name, 'task_name is required');
    assert.equal(res.body.errors.problem_statement, 'problem_statement is required');
    assert.equal(res.body.errors.collab_percentage, 'collab_percentage must be at most 100');
    assert.equal(res.body.errors.time_limit, 'time_limit must be at least 1');
    assert.equal(res.body.errors.difficulty, 'difficulty must be one of: EASY, MEDIUM, HARD');
});

test('validateModuleCreateRequest rejects active content uploads', async () => {
    const { res, nextCalled } = await runMiddleware(validateModuleCreateRequest, {
        body: {
            course_id: '507f1f77bcf86cd799439011',
            module_name: 'Unsafe Upload',
        },
        files: [
            {
                originalname: 'payload.html',
                mimetype: 'text/html',
            },
        ],
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Validation failed');
    assert.equal(res.body.errors['files[0]'], 'files[0] has an unsupported file type');
});

test('validateDesktopResultRequest rejects invalid desktop result submissions', async () => {
    const { res, nextCalled } = await runMiddleware(validateDesktopResultRequest, {
        params: { id: '507f1f77bcf86cd799439011' },
        body: {
            status: 'BROKEN',
            passed_test_cases: -1,
            raw_result: [],
        },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Validation failed');
    assert.equal(res.body.errors.status, 'status must be one of: PASSED, FAILED');
    assert.equal(res.body.errors.passed_test_cases, 'passed_test_cases must be at least 0');
    assert.equal(res.body.errors.raw_result, 'raw_result must be an object');
});

test('validateAnnouncementCreateRequest requires course_id for instructors', async () => {
    const { res, nextCalled } = await runMiddleware(validateAnnouncementCreateRequest, {
        user: { role: 'INSTRUCTOR' },
        body: {
            title: 'Lab update',
            message: 'New schedule',
            audience_type: 'GLOBAL',
        },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Validation failed');
    assert.equal(res.body.errors.course_id, 'course_id is required');
});

test('validateAnnouncementCreateRequest rejects invalid expiry duration', async () => {
    const { res, nextCalled } = await runMiddleware(validateAnnouncementCreateRequest, {
        user: { role: 'ADMIN' },
        body: {
            title: 'Lab update',
            message: 'New schedule',
            audience_type: 'GLOBAL',
            expires_in_minutes: 0,
        },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Validation failed');
    assert.equal(res.body.errors.expires_in_minutes, 'expires_in_minutes must be at least 1');
});

test('handleUploadMiddleware standardizes upload failures', async () => {
    const uploadMiddleware = (_req, _res, next) => next(new Error('Only PDF files are allowed'));
    const wrappedMiddleware = handleUploadMiddleware(uploadMiddleware);
    const { res, nextCalled } = await runMiddleware(wrappedMiddleware, {});

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        message: 'Validation failed',
        errors: {
            file: 'Only PDF files are allowed',
        },
    });
});
