const dotenv = require('dotenv');
const { installConsoleBridge, logger } = require('./utils/logger');
const connectDB = require('./config/db');
const { createApp } = require('./app');
const { initChatService } = require('./services/chatService');
const { initVectorStore } = require('./services/vectorStore');
const { captureError, emitMonitoringEvent } = require('./services/monitoringService');
const { scheduleExistingAnnouncementExpiries } = require('./services/announcementExpiryService');

dotenv.config();
installConsoleBridge();

connectDB();

const app = createApp();

const PORT = process.env.PORT || 5001;

process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('process.unhandled_rejection', { error });
    captureError(error, { source: 'process.unhandledRejection' });
});

process.on('uncaughtException', (error) => {
    logger.error('process.uncaught_exception', { error });
    captureError(error, { source: 'process.uncaughtException' });
});

const server = app.listen(PORT, async () => {
    logger.info('server.started', { port: PORT });
    emitMonitoringEvent('server.started', { port: PORT });

    try {
        initChatService();
        await initVectorStore();
        logger.info('server.rag_initialized');
    } catch (err) {
        logger.warn('server.rag_partial_init', { error: err });
        captureError(err, { source: 'server.rag_init' });
    }

    await scheduleExistingAnnouncementExpiries();
});

module.exports = { app, server };
