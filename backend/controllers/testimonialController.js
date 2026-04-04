const Testimonial = require('../models/Testimonial');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isAdminRole = (role) => role === 'ADMIN' || role === 'admin';

const testimonialImageStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads', 'testimonials');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    }
});

const testimonialImageUpload = multer({
    storage: testimonialImageStorage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype && file.mimetype.startsWith('image/')) {
            cb(null, true);
            return;
        }

        cb(new Error('Only image files are allowed for testimonials'));
    }
});

const testimonialImageUploadMiddleware = testimonialImageUpload.single('image');

const removeFileIfPresent = (relativePath) => {
    if (!relativePath) return;

    const absolutePath = path.join(__dirname, '..', relativePath);
    if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
    }
};

const serializeTestimonial = (testimonial) => ({
    _id: testimonial._id,
    name: testimonial.name,
    role: testimonial.role,
    quote: testimonial.quote,
    image_filename: testimonial.image_filename,
    image_path: testimonial.image_path,
    createdAt: testimonial.createdAt,
    updatedAt: testimonial.updatedAt,
});

// @desc    Get public testimonials
// @route   GET /api/testimonials
// @access  Public
const getTestimonials = async (_req, res) => {
    try {
        const testimonials = await Testimonial.find().sort({ createdAt: -1 });
        res.json(testimonials.map(serializeTestimonial));
    } catch (error) {
        console.error('Get testimonials error:', error);
        res.status(500).json({ message: 'Failed to fetch testimonials' });
    }
};

// @desc    Create testimonial
// @route   POST /api/testimonials
// @access  Private (Admin)
const createTestimonial = async (req, res) => {
    try {
        if (!req.user || !isAdminRole(req.user.role)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { name, role, quote } = req.body;

        if (!name?.trim() || !role?.trim() || !quote?.trim()) {
            removeFileIfPresent(req.file ? path.join('uploads', 'testimonials', req.file.filename) : null);
            return res.status(400).json({ message: 'Name, role, and quote are required' });
        }

        const testimonial = await Testimonial.create({
            name: name.trim(),
            role: role.trim(),
            quote: quote.trim(),
            image_filename: req.file?.originalname || null,
            image_path: req.file ? path.join('uploads', 'testimonials', req.file.filename) : null,
            created_by: req.user._id,
        });

        res.status(201).json(serializeTestimonial(testimonial));
    } catch (error) {
        console.error('Create testimonial error:', error);
        res.status(500).json({ message: 'Failed to create testimonial' });
    }
};

// @desc    Update testimonial
// @route   PUT /api/testimonials/:id
// @access  Private (Admin)
const updateTestimonial = async (req, res) => {
    try {
        if (!req.user || !isAdminRole(req.user.role)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) {
            removeFileIfPresent(req.file ? path.join('uploads', 'testimonials', req.file.filename) : null);
            return res.status(404).json({ message: 'Testimonial not found' });
        }

        const { name, role, quote } = req.body;

        testimonial.name = name?.trim() || testimonial.name;
        testimonial.role = role?.trim() || testimonial.role;
        testimonial.quote = quote?.trim() || testimonial.quote;

        if (req.file) {
            removeFileIfPresent(testimonial.image_path);
            testimonial.image_filename = req.file.originalname;
            testimonial.image_path = path.join('uploads', 'testimonials', req.file.filename);
        }

        await testimonial.save();

        res.json(serializeTestimonial(testimonial));
    } catch (error) {
        console.error('Update testimonial error:', error);
        res.status(500).json({ message: 'Failed to update testimonial' });
    }
};

// @desc    Delete testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private (Admin)
const deleteTestimonial = async (req, res) => {
    try {
        if (!req.user || !isAdminRole(req.user.role)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }

        removeFileIfPresent(testimonial.image_path);
        await testimonial.deleteOne();

        res.json({ message: 'Testimonial deleted' });
    } catch (error) {
        console.error('Delete testimonial error:', error);
        res.status(500).json({ message: 'Failed to delete testimonial' });
    }
};

module.exports = {
    getTestimonials,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    testimonialImageUploadMiddleware,
};
