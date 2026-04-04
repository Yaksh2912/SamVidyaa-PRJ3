const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
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

app.use(cors());
app.use(express.json());

// Serve uploaded files (handouts, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
