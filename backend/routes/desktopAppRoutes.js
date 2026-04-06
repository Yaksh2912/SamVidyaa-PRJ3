const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');
const { handleUploadMiddleware, validateDesktopAppUploadRequest } = require('../middleware/requestValidation');
const {
    getLatestDesktopApp,
    downloadDesktopApp,
    uploadDesktopApp,
    deleteDesktopApp,
    desktopAppUploadMiddleware,
} = require('../controllers/desktopAppController');
const desktopAppUploadRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: 'Too many desktop app upload requests. Please wait before trying again.',
});

router.get('/latest', getLatestDesktopApp);
router.get('/download', downloadDesktopApp);
router.post('/upload', protect, desktopAppUploadRateLimiter, handleUploadMiddleware(desktopAppUploadMiddleware), validateDesktopAppUploadRequest, uploadDesktopApp);
router.delete('/', protect, deleteDesktopApp);

module.exports = router;
