const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    testimonialImageUploadMiddleware,
} = require('../controllers/testimonialController');

router.get('/', getTestimonials);
router.post('/', protect, testimonialImageUploadMiddleware, createTestimonial);
router.put('/:id', protect, testimonialImageUploadMiddleware, updateTestimonial);
router.delete('/:id', protect, deleteTestimonial);

module.exports = router;
