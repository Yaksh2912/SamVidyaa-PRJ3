const { handleChatMessage, getChatHistory, clearChatHistory } = require('../services/chatService');
const { embedAndStore } = require('../services/vectorStore');
const path = require('path');
const fs = require('fs');

/**
 * POST /api/chat
 * Send a message to the RAG chatbot.
 * Requires JWT authentication — student_id comes from req.user._id
 */
const sendMessage = async (req, res) => {
    try {
        const studentId = req.user._id; // From JWT (authMiddleware)
        const { message } = req.body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({ message: 'Message is required.' });
        }

        if (message.length > 2000) {
            return res.status(400).json({ message: 'Message is too long. Please keep it under 2000 characters.' });
        }

        const result = await handleChatMessage(studentId, message.trim());

        res.json({
            reply: result.reply,
            sources: result.sources,
        });
    } catch (error) {
        console.error('[ChatController] sendMessage error:', error.message);
        res.status(500).json({ message: 'Failed to process your message. Please try again.' });
    }
};

/**
 * GET /api/chat/history
 * Get chat history for the logged-in student.
 */
const getHistory = async (req, res) => {
    try {
        const studentId = req.user._id;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const skip = parseInt(req.query.skip) || 0;

        const messages = await getChatHistory(studentId, limit, skip);

        res.json(messages);
    } catch (error) {
        console.error('[ChatController] getHistory error:', error.message);
        res.status(500).json({ message: 'Failed to retrieve chat history.' });
    }
};

/**
 * DELETE /api/chat/history
 * Clear chat history for the logged-in student.
 */
const deleteHistory = async (req, res) => {
    try {
        const studentId = req.user._id;
        await clearChatHistory(studentId);
        res.json({ message: 'Chat history cleared successfully.' });
    } catch (error) {
        console.error('[ChatController] deleteHistory error:', error.message);
        res.status(500).json({ message: 'Failed to clear chat history.' });
    }
};

/**
 * POST /api/chat/ingest
 * Ingest a document into the vector store for general knowledge.
 * INSTRUCTOR/ADMIN ONLY — regular students cannot add documents.
 */
const ingestDocument = async (req, res) => {
    try {
        const { text, source, courseId, courseName } = req.body;

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({ message: 'Document text is required.' });
        }

        const chunksStored = await embedAndStore(text.trim(), {
            source: source || 'manual-upload',
            courseId: courseId || '',
            courseName: courseName || '',
            type: 'course-material',
        });

        res.json({
            message: `Document ingested successfully. ${chunksStored} chunks stored.`,
            chunksStored,
        });
    } catch (error) {
        console.error('[ChatController] ingestDocument error:', error.message);
        res.status(500).json({ message: 'Failed to ingest document.' });
    }
};

/**
 * POST /api/chat/ingest-pdf
 * Ingest an already-uploaded PDF handout into the vector store.
 * INSTRUCTOR/ADMIN ONLY — expects the file path of an existing upload.
 */
const ingestPdf = async (req, res) => {
    try {
        const { filePath, courseId, courseName } = req.body;

        if (!filePath) {
            return res.status(400).json({ message: 'File path is required.' });
        }

        const absolutePath = path.resolve(__dirname, '..', filePath);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ message: 'File not found.' });
        }

        // Dynamic import of pdf-parse (only needed for this endpoint)
        let pdfParse;
        try {
            pdfParse = require('pdf-parse');
        } catch (e) {
            return res.status(500).json({
                message: 'pdf-parse module not installed. Run: npm install pdf-parse',
            });
        }

        const dataBuffer = fs.readFileSync(absolutePath);
        const pdfData = await pdfParse(dataBuffer);

        if (!pdfData.text || pdfData.text.trim().length === 0) {
            return res.status(400).json({ message: 'Could not extract text from PDF.' });
        }

        const chunksStored = await embedAndStore(pdfData.text, {
            source: path.basename(filePath),
            courseId: courseId || '',
            courseName: courseName || '',
            type: 'course-handout',
        });

        res.json({
            message: `PDF ingested successfully. ${chunksStored} chunks stored from ${pdfData.numpages} pages.`,
            chunksStored,
            pages: pdfData.numpages,
        });
    } catch (error) {
        console.error('[ChatController] ingestPdf error:', error.message);
        res.status(500).json({ message: 'Failed to ingest PDF.' });
    }
};

module.exports = {
    sendMessage,
    getHistory,
    deleteHistory,
    ingestDocument,
    ingestPdf,
};
