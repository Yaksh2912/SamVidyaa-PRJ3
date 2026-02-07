const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createTask, getTasks, deleteTask } = require('../controllers/taskController');

router.route('/')
    .post(protect, createTask)
    .get(protect, getTasks);

router.route('/:id').delete(protect, deleteTask);

module.exports = router;
