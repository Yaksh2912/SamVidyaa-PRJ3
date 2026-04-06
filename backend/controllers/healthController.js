const { isReady: isChatReady } = require('../services/chatService');
const { isReady: isVectorStoreReady } = require('../services/vectorStore');

function getHealth(_req, res) {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
        services: {
            chat: isChatReady() ? 'ready' : 'degraded',
            vectorStore: isVectorStoreReady() ? 'ready' : 'degraded',
        },
    });
}

module.exports = {
    getHealth,
};
