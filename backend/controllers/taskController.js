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

module.exports = { createTask, getTasks, deleteTask };
