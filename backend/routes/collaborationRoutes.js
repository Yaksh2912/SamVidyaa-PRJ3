const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createRequest, getMyRequests, respondToRequest } = require('../controllers/collaborationController');

router.post('/request', protect, createRequest);
router.get('/me', protect, getMyRequests);
router.put('/:id/respond', protect, respondToRequest);

module.exports = router;
