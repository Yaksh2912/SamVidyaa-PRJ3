const Task = require('../models/Task');
const Module = require('../models/Module');
const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');

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

module.exports = { createTask, getTasks, deleteTask, updateTask, completeTask };
