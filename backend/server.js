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
app.use('/api/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
