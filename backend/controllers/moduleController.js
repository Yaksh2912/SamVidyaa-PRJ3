const Module = require('../models/Module');
const Task = require('../models/Task');
const CodingQuestion = require('../models/CodingQuestion');
const archive = require('archiver');
const fs = require('fs');
const path = require('path');

const attachTaskCounts = async (modules) => {
    if (!modules.length) return modules;

    const moduleIds = modules.map((module) => module._id);
    const taskCounts = await Task.aggregate([
        {
            $match: {
                module_id: { $in: moduleIds }
            }
        },
        {
            $group: {
                _id: '$module_id',
                count: { $sum: 1 }
            }
        }
    ]);

    const taskCountMap = new Map(
        taskCounts.map((entry) => [entry._id.toString(), entry.count])
    );

    return modules.map((module) => {
        const moduleObject = typeof module.toObject === 'function' ? module.toObject() : module;
        moduleObject.task_count = taskCountMap.get(module._id.toString()) || 0;
        return moduleObject;
    });
};

// @desc    Create a new module
// @route   POST /api/modules
// @access  Private (Teacher/Admin)
const createModule = async (req, res) => {
    try {
        const { course_id, module_name, description, module_order, tasks_per_module, module_test_questions } = req.body;

        if (!course_id || !module_name) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const lastModule = await Module.findOne({ course_id })
            .sort({ module_order: -1, createdAt: -1 })
            .select('module_order');

        const resolvedModuleOrder = Number(module_order) > 0
            ? Number(module_order)
            : ((lastModule?.module_order || 0) + 1);

        // req.files is array because of upload.array() middleware
        const files = req.files ? req.files.map(file => ({
            name: file.originalname,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
        })) : [];

        const newModule = await Module.create({
            course_id,
            module_name,
            description,
            module_order: resolvedModuleOrder,
            tasks_per_module,
            module_test_questions,
            files,
            createdBy: req.user._id
        });

        res.status(201).json(newModule);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Failed to create module' });
    }
};

// @desc    Update a module
// @route   PUT /api/modules/:id
// @access  Private (Teacher/Admin)
const updateModule = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        if (module.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'ADMIN') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const {
            module_name,
            description,
            module_order,
            tasks_per_module,
            module_test_questions,
            points,
            is_active,
        } = req.body;

        const newFiles = req.files ? req.files.map(file => ({
            name: file.originalname,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
        })) : [];

        module.module_name = module_name ?? module.module_name;
        module.description = description ?? module.description;
        module.module_order = module_order ?? module.module_order;
        module.tasks_per_module = tasks_per_module ?? module.tasks_per_module;
        module.module_test_questions = module_test_questions ?? module.module_test_questions;
        module.points = points ?? module.points;

        if (typeof is_active !== 'undefined') {
            module.is_active = is_active === true || is_active === 'true';
        }

        if (newFiles.length) {
            module.files = [...(module.files || []), ...newFiles];
        }

        const updatedModule = await module.save();
        res.json(updatedModule);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Failed to update module' });
    }
};

// @desc    Get all modules for the logged in teacher
// @route   GET /api/modules
// @access  Private
const getTeacherModules = async (req, res) => {
    try {
        const { course_id } = req.query;
        let query = { createdBy: req.user._id };

        if (course_id) {
            query.course_id = course_id;
        }

        const modules = await Module.find(query)
            .sort({ module_order: 1, createdAt: -1 })
            .populate('course_id', 'course_name course_code');

        res.json(await attachTaskCounts(modules));
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all modules for a specific course (used by students to view curriculum)
// @route   GET /api/modules/course/:courseId
// @access  Private
const getCourseModules = async (req, res) => {
    try {
        const modules = await Module.find({ course_id: req.params.courseId })
            .sort({ module_order: 1 });
        res.json(await attachTaskCounts(modules));
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a single uploaded resource file from a module
// @route   DELETE /api/modules/:id/files
// @access  Private (Teacher/Admin)
const deleteModuleFile = async (req, res) => {
    try {
        const { filePath } = req.body;
        const module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        if (module.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'ADMIN') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (!filePath) {
            return res.status(400).json({ message: 'File path is required' });
        }

        const existingFile = module.files?.find((file) => file.path === filePath);

        if (!existingFile) {
            return res.status(404).json({ message: 'Resource file not found' });
        }

        const absoluteFilePath = path.join(__dirname, '..', existingFile.path);
        if (fs.existsSync(absoluteFilePath)) {
            fs.unlinkSync(absoluteFilePath);
        }

        module.files = (module.files || []).filter((file) => file.path !== filePath);
        const updatedModule = await module.save();

        res.json(updatedModule);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete module file' });
    }
};



// @desc    Delete a module
// @route   DELETE /api/modules/:id
// @access  Private (Teacher/Admin)
const deleteModule = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        // Check ownership
        if (module.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Optional: Delete associated files from filesystem
        // if (module.files && module.files.length > 0) {
        //     module.files.forEach(file => {
        //         fs.unlink(file.path, (err) => {
        //             if (err) console.error("Failed to delete file:", file.path);
        //         });
        //     });
        // }

        await module.deleteOne();
        res.json({ message: 'Module removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete module' });
    }
};
// @desc    Export module as JSON
// @route   GET /api/modules/:id/export
// @access  Private (Teacher/Admin)
const exportModule = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id);

        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        // Check ownership
        if (module.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'ADMIN') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        console.log(`Exporting module JSON: ${module.module_name}`);

        const tasks = await Task.find({ module_id: module._id });
        const moduleTestQs = await CodingQuestion.find({ module_id: module._id, question_type: 'MODULE_TEST' });

        const mappedTasks = tasks.map(t => ({
            taskName: t.task_name,
            description: t.description,
            problemStatement: t.problem_statement,
            expectedOutput: t.expected_output,
            sampleInput: t.sample_input,
            sampleOutput: t.sample_output,
            difficulty: t.difficulty,
            points: t.points,
            timeLimit: t.time_limit,
            language: t.language,
            testCases: t.test_cases ? t.test_cases.map(tc => ({
                input: tc.input,
                expectedOutput: tc.expected_output,
                isSample: tc.is_sample,
                orderIndex: tc.order_index
            })) : []
        }));

        const mappedModuleTestQs = moduleTestQs.map(q => ({
            questionType: q.question_type,
            questionText: q.question_text,
            problemStatement: q.problem_statement,
            expectedOutput: q.expected_output,
            sampleInput: q.sample_input,
            sampleOutput: q.sample_output,
            difficulty: q.difficulty,
            points: q.points,
            timeLimit: q.time_limit,
            language: q.language,
            testCases: q.test_cases ? q.test_cases.map(tc => ({
                input: tc.input,
                expectedOutput: tc.expected_output,
                isSample: tc.is_sample,
                orderIndex: tc.order_index
            })) : []
        }));

        const exportData = {
            exportType: "MODULE",
            exportVersion: "1.0",
            exportDate: new Date().toISOString(),
            module: {
                moduleName: module.module_name,
                description: module.description,
                moduleOrder: module.module_order,
                tasksPerModule: module.tasks_per_module,
                moduleTestQuestionsCount: module.module_test_questions,
                isActive: module.is_active !== undefined ? module.is_active : true,
                tasks: mappedTasks,
                moduleTestQuestions: mappedModuleTestQs
            }
        };

        const archiveZip = archive('zip', {
            zlib: { level: 9 }
        });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const zipFileName = `module_export_${module.module_name.replace(/ /g, '_')}_${timestamp}.zip`;

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);

        archiveZip.pipe(res);

        archiveZip.append(JSON.stringify(exportData, null, 2), { name: 'module_data.json' });

        await archiveZip.finalize();

    } catch (error) {
        console.error('Module export error:', error);
        res.status(500).json({ message: 'Module export failed' });
    }
};

module.exports = {
    createModule,
    updateModule,
    getTeacherModules,
    getCourseModules,
    deleteModuleFile,
    deleteModule,
    exportModule
};
