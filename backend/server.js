const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { getHealth } = require('./controllers/healthController');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { createRateLimiter } = require('./middleware/rateLimitMiddleware');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const courseRoutes = require('./routes/courseRoutes');
const taskRoutes = require('./routes/taskRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { initChatService } = require('./services/chatService');
const { initVectorStore } = require('./services/vectorStore');

dotenv.config();

connectDB();

const app = express();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        const error = new Error('CORS origin not allowed');
        error.statusCode = 403;
        callback(error);
    },
};

const apiRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 240,
    message: 'Too many API requests. Please slow down and try again shortly.',
});

const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many authentication attempts. Please try again later.',
});

const chatRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 40,
    message: 'Too many chat requests. Please wait a moment and try again.',
});

app.disable('x-powered-by');
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/api', apiRateLimiter);
app.use('/api/auth', authRateLimiter);
app.use('/api/chat', chatRateLimiter);

// Only explicitly public uploads stay public.
app.use('/uploads/testimonials', express.static(path.join(__dirname, 'uploads', 'testimonials')));

app.get('/health', getHealth);
app.get('/api/health', getHealth);

app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/collaborations', require('./routes/collaborationRoutes'));
app.use('/api/desktop-app', require('./routes/desktopAppRoutes'));
app.use('/api/testimonials', require('./routes/testimonialRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    // Initialize RAG services (non-blocking)
    try {
        initChatService();
        await initVectorStore();
        console.log('[Server] RAG chatbot services initialized.');
    } catch (err) {
        console.warn('[Server] RAG services partially initialized:', err.message);
    }
});
