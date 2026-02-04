const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const { createModule, getTeacherModules, exportModule, deleteModule } = require('../controllers/moduleController');

// Multer Config
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
});

router.route('/')
    .post(protect, upload.array('files'), createModule)
    .get(protect, getTeacherModules);

router.route('/:id')
    .get(protect, (req, res) => {
        // If we want to view a single module... not implemented yet broadly but the route should support it or we split export
        // The export route is specific below. 
        // For general operations on ID:
    })
    .delete(protect, deleteModule);

router.route('/:id/export').get(protect, exportModule);

module.exports = router;
