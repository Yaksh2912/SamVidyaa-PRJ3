const Task = require('../models/Task');
const Module = require('../models/Module');

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

module.exports = { createTask, getTasks };
