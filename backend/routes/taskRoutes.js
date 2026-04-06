const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const { createTask, importTasksFromDocument, getTasks, getTaskHistory, deleteTask, updateTask, recordDesktopTaskResult, completeTask } = require('../controllers/taskController');

const upload = multer({ storage: multer.memoryStorage() });

router.route('/')
    .post(protect, createTask)
    .get(protect, getTasks);

router.post('/import', protect, upload.single('document'), importTasksFromDocument);
router.get('/history', protect, getTaskHistory);
router.post('/:id/desktop-result', protect, recordDesktopTaskResult);

router.route('/:id')
    .put(protect, updateTask)
    .delete(protect, deleteTask);

router.post('/:id/complete', protect, completeTask);

module.exports = router;
