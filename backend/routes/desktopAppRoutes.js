const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getLatestDesktopApp,
    downloadDesktopApp,
    uploadDesktopApp,
    deleteDesktopApp,
    desktopAppUploadMiddleware,
} = require('../controllers/desktopAppController');

router.get('/latest', getLatestDesktopApp);
router.get('/download', downloadDesktopApp);
router.post('/upload', protect, desktopAppUploadMiddleware, uploadDesktopApp);
router.delete('/', protect, deleteDesktopApp);

module.exports = router;
