const { emitMonitoringEvent } = require('../services/monitoringService');
const { logger } = require('../utils/logger');

function createRateLimiter({
    windowMs = 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later.',
} = {}) {
    const requestLog = new Map();

    return (req, res, next) => {
        const now = Date.now();
        const key = req.user?._id?.toString?.() || req.ip || 'anonymous';
        const windowStart = now - windowMs;
        const existing = requestLog.get(key) || [];
        const recent = existing.filter((timestamp) => timestamp > windowStart);

        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - recent.length)));

        if (recent.length >= max) {
            logger.warn('rate_limit.exceeded', {
                requestId: req.requestId,
                key,
                method: req.method,
                path: req.originalUrl || req.url,
                max,
                windowMs,
            });
            emitMonitoringEvent('rate_limit.exceeded', {
                requestId: req.requestId,
                key,
                method: req.method,
                path: req.originalUrl || req.url,
                max,
                windowMs,
            });
            return res.status(429).json({ message });
        }

        recent.push(now);
        requestLog.set(key, recent);
        next();
    };
}

module.exports = {
    createRateLimiter,
};
