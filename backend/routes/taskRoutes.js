const express = require('express');
const router = express.Router();
const { protect, instructorOrAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
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

const taskImportExtensions = new Set(['.pdf', '.doc', '.docx', '.rtf', '.txt', '.md', '.csv', '.xlsx']);
const taskImportMimeTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/rtf',
    'text/rtf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter(_req, file, cb) {
        const extension = path.extname(file.originalname || '').toLowerCase();
        if (taskImportExtensions.has(extension) && (!file.mimetype || taskImportMimeTypes.has(file.mimetype))) {
            cb(null, true);
            return;
        }

        cb(new Error('Only PDF, document, text, CSV, and XLSX files are allowed'));
    },
});

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
