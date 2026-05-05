const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    sendMessage,
    getHistory,
    deleteHistory,
    ingestDocument,
    ingestPdf,
} = require('../controllers/chatController');

/**
 * Middleware to restrict routes to instructors and admins only.
 */
const instructorOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'INSTRUCTOR' || req.user.role === 'ADMIN')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Instructor or Admin role required.' });
    }
};

// ─── Student Chat Endpoints ───────────────────────────────────────────
// All require JWT authentication

// POST /api/chat — Send a message to the chatbot
router.post('/', protect, sendMessage);

// GET /api/chat/history — Get chat history
router.get('/history', protect, getHistory);

// DELETE /api/chat/history — Clear chat history
router.delete('/history', protect, deleteHistory);

// ─── Document Ingestion (Instructors/Admins Only) ─────────────────────

// POST /api/chat/ingest — Ingest raw text
router.post('/ingest', protect, instructorOrAdmin, ingestDocument);

// POST /api/chat/ingest-pdf — Ingest an uploaded PDF
router.post('/ingest-pdf', protect, instructorOrAdmin, ingestPdf);

module.exports = router;
