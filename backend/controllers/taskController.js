const Task = require('../models/Task');
const Module = require('../models/Module');
const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');
const { PDFParse } = require('pdf-parse');
const xlsx = require('xlsx');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
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
    if (instructorId !== user._id.toString() && user.role !== 'ADMIN') {
        return { error: { status: 401, message: 'Not authorized' } };
    }

    return { module };
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

        const task = await Task.create({
            module_id,
            task_name,
            problem_statement,
            test_cases,
            ...rest
        });

        // Update module task count
        await Module.findByIdAndUpdate(module_id, { $inc: { total_tasks: 1 } });

        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Failed to create task' });
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

        const tasks = await Task.find({ module_id });
        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Failed to fetch tasks' });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Ideally check ownership via module -> course -> instructor
        // For now, assuming authenticated teacher is enough or we rely on frontend scope

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
        
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
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
        res.status(500).json({ message: 'Failed to update task' });
    }
};

// @desc    Complete a task and optionally award peers colab points
// @route   POST /api/tasks/:id/complete
// @access  Private (Student)
const completeTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const { collaboratorIds } = req.body; // Array of peer user IDs

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // 1. Calculate the split
        let studentPoints = task.points || 0;
        let peerPointsEach = 0;
        let collaboratorsAwarded = 0;
        const validPeers = (collaboratorIds || []).filter(id => id.toString() !== req.user._id.toString());

        if (task.allow_collaboration && task.collab_percentage > 0 && validPeers.length > 0) {
            const peerPool = Math.round((task.points * task.collab_percentage) / 100);
            studentPoints = task.points - peerPool;
            peerPointsEach = Math.round(peerPool / validPeers.length);
        }

        // 2. Award points to the student completing the task
        const currentUser = await User.findById(req.user._id);
        if (!currentUser) return res.status(404).json({ message: 'User not found' });

        currentUser.points = (currentUser.points || 0) + studentPoints;
        await currentUser.save();

        if (studentPoints > 0) {
            await PointTransaction.create({
                user_id: currentUser._id,
                amount: studentPoints,
                reason: `Completed Task: ${task.task_name}`
            });
        }

        // 3. Award colab points to peers
        if (peerPointsEach > 0 && validPeers.length > 0) {
            for (const collabId of validPeers) {
                const peer = await User.findById(collabId);
                if (peer) {
                    peer.points = (peer.points || 0) + peerPointsEach;
                    await peer.save();

                    await PointTransaction.create({
                        user_id: peer._id,
                        amount: peerPointsEach,
                        reason: 'Collaboration/Teamwork'
                    });
                    collaboratorsAwarded++;
                }
            }
        }

        res.json({
            message: `Task completed! You earned ${studentPoints} pts.` + (collaboratorsAwarded > 0 ? ` (Shared ${peerPointsEach * collaboratorsAwarded} pts with ${collaboratorsAwarded} peers)` : ''),
            points: currentUser.points
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to complete task' });
    }
};

module.exports = { createTask, importTasksFromDocument, getTasks, deleteTask, updateTask, completeTask };
