const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getProtectedFile } = require('../controllers/fileController');

router.get('/', protect, getProtectedFile);

module.exports = router;
