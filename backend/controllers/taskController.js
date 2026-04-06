const Task = require('../models/Task');
const Module = require('../models/Module');
const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');
const StudentProgress = require('../models/StudentProgress');
const TaskCompletion = require('../models/TaskCompletion');
const DesktopTaskResult = require('../models/DesktopTaskResult');
const Enrollment = require('../models/Enrollment');
const { PDFParse } = require('pdf-parse');
const xlsx = require('xlsx');
const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const isAdminRole = (role) => role === 'ADMIN' || role === 'admin';
const isStudentRole = (role) => role === 'STUDENT' || role === 'student';
const ALLOWED_TASK_COMPLETION_STATUSES = ['ACTIVE', 'APPROVED'];

const createRequestError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const applySessionToQuery = (query, session) => {
    if (session && query && typeof query.session === 'function') {
        return query.session(session);
    }

    return query;
};

const createOneWithSession = async (Model, payload, session) => {
    if (!session) {
        return Model.create(payload);
    }

    const [createdDocument] = await Model.create([payload], { session });
    return createdDocument;
};

const normalizeImportedText = (text) => text
    .replace(/\r/g, '')
    .replace(/\u0000/g, '')
    .replace(/^\s*--\s*\d+\s+of\s+\d+\s*--\s*$/gim, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const stripLeadingLabel = (value = '') => value
    .replace(/^(task|question|problem|assignment)\s*\d*\s*[:.-]?\s*/i, '')
    .replace(/^\d+[\).:-]?\s*/, '')
    .trim();

const normalizeHeaderKey = (value = '') => value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const extractInlineValue = (section, labels) => {
    const escapedLabels = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(
        `(?:^|\\n)\\s*(?:${escapedLabels.join('|')})\\s*[:.-]\\s*([\\s\\S]*?)(?=\\n\\s*(?:task\\s*\\d+|question\\s*\\d+|problem\\s*\\d+|assignment\\s*\\d+|[A-Za-z][A-Za-z ]+\\s*[:.-])|$)`,
        'i'
    );
    const match = section.match(pattern);
    return match ? match[1].trim() : '';
};

const extractFieldValue = (section, preferredLabels, stopLabels = []) => {
    const escapedPreferred = preferredLabels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const escapedStop = stopLabels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const stopPattern = escapedStop.length
        ? `(?=\\n\\s*(?:${escapedStop.join('|')})\\s*[:.-]|$)`
        : '$';
    const pattern = new RegExp(
        `(?:^|\\n)\\s*(?:${escapedPreferred.join('|')})\\s*[:.-]\\s*([\\s\\S]*?)${stopPattern}`,
        'i'
    );
    const match = section.match(pattern);
    return match ? match[1].trim() : '';
};

const parseTestCases = (section) => {
    const cases = [];
    const regex = /(?:^|\n)\s*(?:test\s*case\s*\d+|sample\s*\d+)?\s*input\s*[:.-]\s*([\s\S]*?)\n\s*(?:expected\s*)?output\s*[:.-]\s*([\s\S]*?)(?=\n\s*(?:test\s*case\s*\d+|sample\s*\d+)?\s*input\s*[:.-]|\n\s*[A-Za-z][A-Za-z ]+\s*[:.-]|$)/gi;
    let match;

    while ((match = regex.exec(section)) !== null) {
        const input = match[1].trim();
        const expected_output = match[2].trim();

        if (input && expected_output) {
            cases.push({
                input,
                expected_output,
                is_sample: cases.length === 0,
                order_index: cases.length + 1
            });
        }
    }

    return cases;
};

const splitImportedTasks = (text) => {
    const normalized = normalizeImportedText(text);
    if (!normalized) return [];

    const sections = normalized
        .split(/\n(?=(?:task\s*name|task\s*title|task\s*\d+\b|question\s*\d+\b|problem\s*\d+\b|assignment\s*\d+\b|(?:task|question|problem|assignment)\s*[:.-]\s*[A-Z]|\d+[\).:-]\s+[A-Z]))/i)
        .map((section) => section.trim())
        .filter(Boolean);

    return sections.length > 1 ? sections : [normalized];
};

const buildTaskDraft = (section) => {
    const lines = section.split('\n').map((line) => line.trim()).filter(Boolean);
    const firstLine = lines[0] || '';
    const explicitTaskName = extractFieldValue(
        section,
        ['task name', 'task title', 'title'],
        ['problem statement', 'description', 'question', 'prompt', 'expected output', 'sample input', 'sample output', 'constraints', 'difficulty', 'points', 'time limit', 'language', 'test cases', 'input', 'output']
    );
    const firstLineIsMetadata = /^(problem statement|description|question|prompt|expected output|sample input|sample output|constraints|difficulty|points|time limit|language|test cases|input|output)\s*[:.-]/i.test(firstLine);
    const titleFromLabel = firstLineIsMetadata ? '' : stripLeadingLabel(firstLine);
    const taskName = explicitTaskName || titleFromLabel;

    const inlineProblemStatement = extractInlineValue(section, ['problem statement', 'description', 'question', 'prompt']);
    const problemStatement = extractFieldValue(
        section,
        ['problem statement', 'description', 'question', 'prompt'],
        ['expected output', 'sample input', 'sample output', 'constraints', 'difficulty', 'points', 'time limit', 'language', 'test cases', 'input', 'output']
    ) || inlineProblemStatement || (firstLineIsMetadata ? '' : lines.slice(1).join('\n').trim());

    const expectedOutput = extractFieldValue(
        section,
        ['expected output', 'output description'],
        ['sample input', 'sample output', 'constraints', 'difficulty', 'points', 'time limit', 'language', 'test cases', 'input', 'output']
    );

    const sampleInput = extractFieldValue(
        section,
        ['sample input'],
        ['sample output', 'constraints', 'difficulty', 'points', 'time limit', 'language', 'test cases', 'expected output']
    ) || extractInlineValue(section, ['input']);

    const sampleOutput = extractFieldValue(
        section,
        ['sample output'],
        ['constraints', 'difficulty', 'points', 'time limit', 'language', 'test cases']
    ) || extractInlineValue(section, ['output', 'expected output']);

    const constraints = extractFieldValue(
        section,
        ['constraints', 'constraint'],
        ['difficulty', 'points', 'time limit', 'language', 'test cases', 'sample input', 'sample output']
    );

    const difficultyRaw = extractInlineValue(section, ['difficulty']).toUpperCase();
    const difficulty = ['EASY', 'MEDIUM', 'HARD'].includes(difficultyRaw) ? difficultyRaw : 'MEDIUM';

    const pointsMatch = extractInlineValue(section, ['points', 'score']).match(/\d+/);
    const timeLimitMatch = extractInlineValue(section, ['time limit', 'time']).match(/\d+/);
    const languageRaw = extractInlineValue(section, ['language']);
    const supportedLanguages = ['Python', 'JavaScript', 'Java', 'C++'];
    const language = supportedLanguages.find((item) => item.toLowerCase() === languageRaw.toLowerCase()) || 'Python';
    const testCases = parseTestCases(section);

    return {
        task_name: taskName,
        problem_statement: problemStatement,
        expected_output: expectedOutput,
        sample_input: sampleInput,
        sample_output: sampleOutput,
        difficulty,
        points: pointsMatch ? Number(pointsMatch[0]) : 10,
        allow_collaboration: false,
        collab_percentage: 50,
        time_limit: timeLimitMatch ? Number(timeLimitMatch[0]) : 30,
        language,
        constraints,
        test_cases: testCases,
        test_cases_count: testCases.length
    };
};

const getStudentTaskAccess = async (studentId, role, taskId, session = null) => {
    if (!isStudentRole(role)) {
        return { error: { status: 401, message: 'Only students can complete tasks' } };
    }

    const task = await applySessionToQuery(Task.findById(taskId), session).lean();
    if (!task) {
        return { error: { status: 404, message: 'Task not found' } };
    }

    const module = await applySessionToQuery(
        Module.findById(task.module_id).populate('course_id', 'course_name'),
        session
    )
        .lean();

    if (!module || !module.course_id) {
        return { error: { status: 404, message: 'Module or course not found' } };
    }

    const enrollment = await applySessionToQuery(
        Enrollment.findOne({
            course_id: module.course_id._id,
            student_id: studentId,
            status: { $in: ALLOWED_TASK_COMPLETION_STATUSES },
        }).select('_id status'),
        session
    ).lean();

    if (!enrollment) {
        return { error: { status: 403, message: 'You are not allowed to complete tasks for this course' } };
    }

    return { task, module, enrollment };
};

const getLatestPassingDesktopResult = async (studentId, taskId, session = null) => applySessionToQuery(
    DesktopTaskResult.findOne({
        student_id: studentId,
        task_id: taskId,
        status: 'PASSED',
    }).sort({ createdAt: -1 }),
    session
).lean();

const getSpreadsheetValue = (row, aliases) => {
    const normalizedRow = Object.entries(row).reduce((acc, [key, value]) => {
        acc[normalizeHeaderKey(key)] = value;
        return acc;
    }, {});

    for (const alias of aliases) {
        const value = normalizedRow[normalizeHeaderKey(alias)];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return String(value).trim();
        }
    }

    return '';
};

const parseBooleanValue = (value) => ['true', 'yes', '1'].includes(String(value || '').trim().toLowerCase());

const buildTaskFromSpreadsheetRow = (row) => {
    const difficultyRaw = getSpreadsheetValue(row, ['difficulty']).toUpperCase();
    const difficulty = ['EASY', 'MEDIUM', 'HARD'].includes(difficultyRaw) ? difficultyRaw : 'MEDIUM';
    const points = Number(getSpreadsheetValue(row, ['points', 'base points'])) || 10;
    const timeLimit = Number(getSpreadsheetValue(row, ['time limit', 'time_limit', 'time'])) || 30;
    const collabPercentage = Number(getSpreadsheetValue(row, ['peer share percentage', 'collab percentage', 'collaboration percentage', 'collab_percentage'])) || 50;
    const language = getSpreadsheetValue(row, ['language']) || 'Python';

    return {
        task_name: getSpreadsheetValue(row, ['task name', 'task_name', 'title']),
        problem_statement: getSpreadsheetValue(row, ['problem statement', 'problem_statement', 'description', 'question', 'prompt']),
        expected_output: getSpreadsheetValue(row, ['expected output', 'expected_output', 'output description']),
        sample_input: getSpreadsheetValue(row, ['sample input', 'sample_input']),
        sample_output: getSpreadsheetValue(row, ['sample output', 'sample_output']),
        difficulty,
        points,
        allow_collaboration: parseBooleanValue(getSpreadsheetValue(row, ['allow collaboration', 'allow_collaboration', 'collaboration'])),
        collab_percentage: collabPercentage,
        time_limit: timeLimit,
        language,
        constraints: getSpreadsheetValue(row, ['constraints', 'constraint']),
        test_cases: [],
        test_cases_count: 0
    };
};

const extractImportedSpreadsheetTasks = (file) => {
    const workbook = xlsx.read(file.buffer, {
        type: 'buffer',
        raw: true,
        cellDates: false
    });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
        return [];
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { defval: '', raw: true });

    return rows
        .map((row) => buildTaskFromSpreadsheetRow(row))
        .filter((task) => Object.values(task).some((value) => {
            if (Array.isArray(value)) return value.length > 0;
            return Boolean(String(value || '').trim());
        }));
};

const extractTextFromWordDocument = async (file) => {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'task-import-'));
    const extension = path.extname(file.originalname || '').toLowerCase() || '.docx';
    const sourcePath = path.join(tempDir, `source${extension}`);

    try {
        await fs.promises.writeFile(sourcePath, file.buffer);
        const { stdout } = await execFileAsync('/usr/bin/textutil', ['-convert', 'txt', '-stdout', sourcePath], {
            maxBuffer: 1024 * 1024 * 10
        });
        return normalizeImportedText(stdout);
    } finally {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
};

const extractImportedDocumentText = async (file) => {
    const extension = path.extname(file.originalname || '').toLowerCase();

    if (file.mimetype === 'application/pdf' || extension === '.pdf') {
        const parser = new PDFParse({ data: file.buffer });

        try {
            const pdfData = await parser.getText();
            return normalizeImportedText(pdfData.text || '');
        } finally {
            await parser.destroy();
        }
    }

    if ([
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ].includes(file.mimetype) || ['.doc', '.docx', '.rtf'].includes(extension)) {
        return extractTextFromWordDocument(file);
    }

    if (file.mimetype.startsWith('text/') || ['.txt', '.md'].includes(extension)) {
        return normalizeImportedText(file.buffer.toString('utf-8'));
    }

    throw new Error('Unsupported document format');
};

const isSpreadsheetImport = (file) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    return ['.csv', '.xlsx', '.xls'].includes(extension)
        || [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ].includes(file.mimetype);
};

const verifyModuleAccess = async (moduleId, user) => {
    const module = await Module.findById(moduleId).populate('course_id', 'instructor');

    if (!module) {
        return { error: { status: 404, message: 'Module not found' } };
    }

    const instructorId = module.course_id?.instructor?.toString();
    if (instructorId !== user._id.toString() && !isAdminRole(user.role)) {
        return { error: { status: 401, message: 'Not authorized' } };
    }

    return { module };
};

const verifyTaskAccess = async (taskId, user) => {
    const task = await Task.findById(taskId);

    if (!task) {
        return { error: { status: 404, message: 'Task not found' } };
    }

    const access = await verifyModuleAccess(task.module_id, user);
    if (access.error) {
        return { error: access.error };
    }

    return { task, module: access.module };
};

const normalizeDeadlineFields = (payload = {}) => {
    const hasDeadline = payload.has_deadline === true || payload.has_deadline === 'true';

    if (!hasDeadline) {
        return {
            has_deadline: false,
            deadline_at: null
        };
    }

    if (!payload.deadline_at) {
        throw new Error('Deadline date and time are required when deadline is enabled');
    }

    const parsedDeadline = new Date(payload.deadline_at);

    if (Number.isNaN(parsedDeadline.getTime())) {
        throw new Error('Invalid deadline date or time');
    }

    return {
        has_deadline: true,
        deadline_at: parsedDeadline
    };
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Teacher/Admin)
const createTask = async (req, res) => {
    try {
        const { module_id, task_name, problem_statement, test_cases, ...rest } = req.body;

        if (!module_id || !task_name || !problem_statement) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const access = await verifyModuleAccess(module_id, req.user);
        if (access.error) {
            return res.status(access.error.status).json({ message: access.error.message });
        }

        const deadlineFields = normalizeDeadlineFields(rest);

        const task = await Task.create({
            module_id,
            task_name,
            problem_statement,
            test_cases,
            ...rest,
            ...deadlineFields
        });

        // Update module task count
        await Module.findByIdAndUpdate(module_id, { $inc: { total_tasks: 1 } });

        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Failed to create task' });
    }
};

// @desc    Import tasks from a PDF/DOC/DOCX/RTF/TXT/CSV/XLSX/XLS file
// @route   POST /api/tasks/import
// @access  Private (Teacher/Admin)
const importTasksFromDocument = async (req, res) => {
    try {
        const { module_id } = req.body;

        if (!module_id) {
            return res.status(400).json({ message: 'Module ID is required' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Document file is required' });
        }

        const access = await verifyModuleAccess(module_id, req.user);
        if (access.error) {
            return res.status(access.error.status).json({ message: access.error.message });
        }

        const resolvedImportedTasks = isSpreadsheetImport(req.file)
            ? extractImportedSpreadsheetTasks(req.file)
            : splitImportedTasks(await extractImportedDocumentText(req.file))
                .map((section) => buildTaskDraft(section))
                .filter((task) => Object.values(task).some((value) => {
                    if (Array.isArray(value)) return value.length > 0;
                    return Boolean(String(value || '').trim());
                }));

        if (!resolvedImportedTasks.length) {
            return res.status(400).json({ message: 'No task details could be identified in the document' });
        }

        const missingFields = resolvedImportedTasks
            .map((task, index) => {
                const fields = [];

                if (!task.task_name?.trim()) fields.push('Task Name');
                if (!task.problem_statement?.trim()) fields.push('Problem Statement');

                return fields.length
                    ? {
                        taskIndex: index + 1,
                        taskName: task.task_name?.trim() || `Task ${index + 1}`,
                        fields
                    }
                    : null;
            })
            .filter(Boolean);

        if (missingFields.length) {
            return res.status(400).json({
                message: 'Some imported tasks are missing required fields',
                missingFields
            });
        }

        const tasksToCreate = resolvedImportedTasks.map((task) => ({
            module_id,
            ...task
        }));

        const createdTasks = await Task.insertMany(tasksToCreate);
        await Module.findByIdAndUpdate(module_id, { $inc: { total_tasks: createdTasks.length } });

        res.status(201).json({
            message: `${createdTasks.length} task${createdTasks.length === 1 ? '' : 's'} imported successfully`,
            tasks: createdTasks
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Failed to import task document' });
    }
};

// @desc    Get tasks for a module
// @route   GET /api/tasks?module_id=xxx
// @access  Private
const getTasks = async (req, res) => {
    try {
        const { module_id } = req.query;

        if (!module_id) {
            return res.status(400).json({ message: 'Module ID is required' });
        }

        let excludedTaskIds = [];

        if (isStudentRole(req.user.role)) {
            excludedTaskIds = await TaskCompletion.distinct('task_id', {
                student_id: req.user._id,
                module_id,
            });
        }

        const taskQuery = { module_id };
        if (excludedTaskIds.length) {
            taskQuery._id = { $nin: excludedTaskIds };
        }

        const tasks = await Task.find(taskQuery).lean();
        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Failed to fetch tasks' });
    }
};

// @desc    Get completed task history for the logged-in student
// @route   GET /api/tasks/history
// @access  Private (Student)
const getTaskHistory = async (req, res) => {
    try {
        if (!isStudentRole(req.user.role)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const completions = await TaskCompletion.find({ student_id: req.user._id })
            .sort({ completed_at: -1, createdAt: -1 })
            .populate('course_id', 'course_name course_code subject')
            .populate('module_id', 'module_name module_order')
            .populate('task_id', 'task_name difficulty language time_limit points')
            .populate('collaborator_ids', 'name email')
            .lean();

        res.json(completions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch task history' });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    try {
        const access = await verifyTaskAccess(req.params.id, req.user);
        if (access.error) {
            return res.status(access.error.status).json({ message: access.error.message });
        }
        const { task } = access;

        await task.deleteOne();

        // Decrement module task count
        await Module.findByIdAndUpdate(task.module_id, { $inc: { total_tasks: -1 } });

        res.json({ message: 'Task removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete task' });
    }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    try {
        const { test_cases, ...updateData } = req.body;

        const access = await verifyTaskAccess(req.params.id, req.user);
        if (access.error) {
            return res.status(access.error.status).json({ message: access.error.message });
        }
        const { task } = access;

        if ('has_deadline' in updateData || 'deadline_at' in updateData) {
            const deadlineFields = normalizeDeadlineFields(updateData);
            delete updateData.has_deadline;
            delete updateData.deadline_at;
            Object.assign(task, deadlineFields);
        }

        // Apply updates
        Object.assign(task, updateData);
        
        if (test_cases) {
            task.test_cases = test_cases;
            task.test_cases_count = test_cases.length;
        }

        const updatedTask = await task.save();
        res.json(updatedTask);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message || 'Failed to update task' });
    }
};

// @desc    Complete a task and optionally award peers colab points
// @route   POST /api/tasks/:id/desktop-result
// @access  Private (Student/Desktop app)
const recordDesktopTaskResult = async (req, res) => {
    try {
        const taskId = req.params.id;
        const {
            status,
            passed_test_cases = 0,
            total_test_cases = 0,
            runtime_ms,
            language = '',
            app_version = '',
            execution_ref = '',
            raw_result = {},
        } = req.body || {};

        const normalizedStatus = String(status || '').toUpperCase();
        if (!['PASSED', 'FAILED'].includes(normalizedStatus)) {
            return res.status(400).json({ message: 'A valid desktop execution status is required' });
        }

        const access = await getStudentTaskAccess(req.user._id, req.user.role, taskId);
        if (access.error) {
            return res.status(access.error.status).json({ message: access.error.message });
        }

        const desktopResult = await DesktopTaskResult.create({
            student_id: req.user._id,
            course_id: access.module.course_id._id,
            module_id: access.task.module_id,
            task_id: access.task._id,
            status: normalizedStatus,
            passed_test_cases: Math.max(0, Number(passed_test_cases) || 0),
            total_test_cases: Math.max(0, Number(total_test_cases) || 0),
            runtime_ms: runtime_ms === undefined || runtime_ms === null ? null : Math.max(0, Number(runtime_ms) || 0),
            language: String(language || ''),
            app_version: String(app_version || ''),
            execution_ref: String(execution_ref || ''),
            raw_result: raw_result && typeof raw_result === 'object' ? raw_result : {},
            submitted_at: new Date(),
        });

        res.status(201).json({
            message: normalizedStatus === 'PASSED'
                ? 'Desktop result recorded and ready for validation'
                : 'Desktop result recorded',
            result: desktopResult,
        });
    } catch (error) {
        console.error(error);

        if (error?.code === 11000) {
            return res.status(400).json({ message: 'This desktop execution result was already submitted' });
        }

        res.status(500).json({ message: 'Failed to record desktop task result' });
    }
};

// @route   POST /api/tasks/:id/complete
// @access  Private (Student)
const completeTask = async (req, res) => {
    let session = null;

    try {
        const taskId = req.params.id;
        const { collaboratorIds } = req.body; // Array of peer user IDs

        const access = await getStudentTaskAccess(req.user._id, req.user.role, taskId);
        if (access.error) {
            return res.status(access.error.status).json({ message: access.error.message });
        }

        const { task, module } = access;
        const [existingCompletion, passedDesktopResult] = await Promise.all([
            TaskCompletion.findOne({
                student_id: req.user._id,
                task_id: task._id,
            }).select('_id').lean(),
            getLatestPassingDesktopResult(req.user._id, task._id),
        ]);

        if (existingCompletion) {
            return res.status(400).json({ message: 'Task already completed' });
        }

        if (!passedDesktopResult) {
            return res.status(400).json({ message: 'Task must be completed in the desktop application before validation' });
        }

        if (task.has_deadline && task.deadline_at && new Date(task.deadline_at).getTime() < Date.now()) {
            return res.status(400).json({ message: 'This task deadline has already passed' });
        }

        session = await mongoose.startSession();
        let responsePayload = null;

        await session.withTransaction(async () => {
            const transactionalAccess = await getStudentTaskAccess(req.user._id, req.user.role, taskId, session);
            if (transactionalAccess.error) {
                throw createRequestError(transactionalAccess.error.status, transactionalAccess.error.message);
            }

            const { task: transactionalTask, module: transactionalModule } = transactionalAccess;
            const [transactionalCompletion, transactionalPassedDesktopResult] = await Promise.all([
                applySessionToQuery(
                    TaskCompletion.findOne({
                        student_id: req.user._id,
                        task_id: transactionalTask._id,
                    }).select('_id'),
                    session
                ).lean(),
                getLatestPassingDesktopResult(req.user._id, transactionalTask._id, session),
            ]);

            if (transactionalCompletion) {
                throw createRequestError(400, 'Task already completed');
            }

            if (!transactionalPassedDesktopResult) {
                throw createRequestError(400, 'Task must be completed in the desktop application before validation');
            }

            if (transactionalTask.has_deadline && transactionalTask.deadline_at && new Date(transactionalTask.deadline_at).getTime() < Date.now()) {
                throw createRequestError(400, 'This task deadline has already passed');
            }

            let studentPoints = transactionalTask.points || 0;
            let peerPointsEach = 0;
            let collaboratorsAwarded = 0;
            const collaboratorPool = Array.isArray(collaboratorIds) ? collaboratorIds : [];
            const uniquePeerIds = [...new Set(collaboratorPool.map((id) => id?.toString()).filter(Boolean))]
                .filter((id) => id !== req.user._id.toString());
            let validPeers = [];

            if (transactionalTask.allow_collaboration && uniquePeerIds.length > 0) {
                const activePeers = await applySessionToQuery(
                    Enrollment.find({
                        course_id: transactionalModule.course_id._id,
                        student_id: { $in: uniquePeerIds },
                        status: { $in: ALLOWED_TASK_COMPLETION_STATUSES },
                    }).select('student_id'),
                    session
                ).lean();

                validPeers = activePeers.map((peer) => peer.student_id.toString());
            }

            if (transactionalTask.allow_collaboration && transactionalTask.collab_percentage > 0 && validPeers.length > 0) {
                const peerPool = Math.round((transactionalTask.points * transactionalTask.collab_percentage) / 100);
                studentPoints = transactionalTask.points - peerPool;
                peerPointsEach = Math.round(peerPool / validPeers.length);
            }

            const currentUser = await applySessionToQuery(User.findById(req.user._id), session);
            if (!currentUser) {
                throw createRequestError(404, 'User not found');
            }

            currentUser.points = (currentUser.points || 0) + studentPoints;
            await currentUser.save({ session });

            if (studentPoints > 0) {
                await createOneWithSession(PointTransaction, {
                    user_id: currentUser._id,
                    amount: studentPoints,
                    reason: `Completed Task: ${transactionalTask.task_name}`,
                    course_id: transactionalModule.course_id._id,
                }, session);
            }

            if (peerPointsEach > 0 && validPeers.length > 0) {
                const peers = await applySessionToQuery(
                    User.find({ _id: { $in: validPeers } }).select('_id'),
                    session
                ).lean();
                const peerIds = peers.map((peer) => peer._id);

                if (peerIds.length) {
                    await Promise.all([
                        User.updateMany(
                            { _id: { $in: peerIds } },
                            { $inc: { points: peerPointsEach } },
                            { session }
                        ),
                        PointTransaction.insertMany(
                            peerIds.map((peerId) => ({
                                user_id: peerId,
                                amount: peerPointsEach,
                                reason: 'Collaboration/Teamwork',
                                course_id: transactionalModule.course_id._id,
                            })),
                            { session }
                        ),
                    ]);

                    collaboratorsAwarded = peerIds.length;
                }
            }

            const totalModuleTasks = await applySessionToQuery(
                Task.countDocuments({ module_id: transactionalTask.module_id }),
                session
            );
            const progress = await StudentProgress.findOneAndUpdate(
                {
                    student_id: req.user._id,
                    course_id: transactionalModule.course_id._id,
                    module_id: transactionalTask.module_id,
                },
                {
                    $setOnInsert: {
                        student_id: req.user._id,
                        course_id: transactionalModule.course_id._id,
                        module_id: transactionalTask.module_id,
                        completed_tasks: 0,
                        module_status: 'NOT_STARTED',
                        can_attempt_module_test: false,
                    }
                },
                {
                    new: true,
                    upsert: true,
                    session,
                }
            );

            progress.completed_tasks = (progress.completed_tasks || 0) + 1;
            const allTasksCompleted = totalModuleTasks > 0 && progress.completed_tasks >= totalModuleTasks;
            progress.module_status = allTasksCompleted ? 'TASKS_COMPLETED' : 'IN_PROGRESS';
            progress.can_attempt_module_test = allTasksCompleted;
            await progress.save({ session });

            const completionRecord = await createOneWithSession(TaskCompletion, {
                student_id: req.user._id,
                course_id: transactionalModule.course_id._id,
                module_id: transactionalTask.module_id,
                task_id: transactionalTask._id,
                task_name: transactionalTask.task_name,
                course_name: transactionalModule.course_id.course_name || '',
                module_name: transactionalModule.module_name || '',
                task_language: transactionalTask.language || '',
                task_difficulty: transactionalTask.difficulty || '',
                task_time_limit: transactionalTask.time_limit || 0,
                task_points: transactionalTask.points || 0,
                points_awarded: studentPoints,
                collaborator_ids: validPeers,
                completed_at: transactionalPassedDesktopResult.submitted_at || new Date(),
            }, session);

            responsePayload = {
                message: `Task completed! You earned ${studentPoints} pts.` + (collaboratorsAwarded > 0 ? ` (Shared ${peerPointsEach * collaboratorsAwarded} pts with ${collaboratorsAwarded} peers)` : ''),
                points: currentUser.points,
                completion: completionRecord,
            };
        });

        res.json(responsePayload);
    } catch (error) {
        if (error?.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }

        console.error(error);
        res.status(500).json({ message: 'Failed to complete task' });
    } finally {
        if (session) {
            await session.endSession();
        }
    }
};

module.exports = { createTask, importTasksFromDocument, getTasks, getTaskHistory, deleteTask, updateTask, recordDesktopTaskResult, completeTask };
