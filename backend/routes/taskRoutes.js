const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createTask, getTasks } = require('../controllers/taskController');

router.route('/')
    .post(protect, createTask)
    .get(protect, getTasks);

module.exports = router;
