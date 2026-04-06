const express = require('express');
const router = express.Router();
const { protect, instructorOrAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const {
    handleUploadMiddleware,
    validateTaskCreateRequest,
    validateTaskUpdateRequest,
    validateTaskDeleteRequest,
    validateTaskImportRequest,
    validateDesktopResultRequest,
    validateTaskCompleteRequest,
} = require('../middleware/requestValidation');
const { createTask, importTasksFromDocument, getTasks, getTaskHistory, deleteTask, updateTask, recordDesktopTaskResult, completeTask } = require('../controllers/taskController');

const upload = multer({ storage: multer.memoryStorage() });

router.route('/')
    .post(protect, instructorOrAdmin, validateTaskCreateRequest, createTask)
    .get(protect, getTasks);

router.post('/import', protect, instructorOrAdmin, handleUploadMiddleware(upload.single('document')), validateTaskImportRequest, importTasksFromDocument);
router.get('/history', protect, getTaskHistory);
router.post('/:id/desktop-result', protect, validateDesktopResultRequest, recordDesktopTaskResult);

router.route('/:id')
    .put(protect, instructorOrAdmin, validateTaskUpdateRequest, updateTask)
    .delete(protect, instructorOrAdmin, validateTaskDeleteRequest, deleteTask);

router.post('/:id/complete', protect, validateTaskCompleteRequest, completeTask);

module.exports = router;
