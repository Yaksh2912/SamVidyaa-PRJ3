const { runWithRequestContext } = require('../utils/requestContext');
const { logger } = require('../utils/logger');
const { emitMonitoringEvent } = require('../services/monitoringService');

const SLOW_REQUEST_THRESHOLD_MS = Number.parseInt(process.env.SLOW_REQUEST_THRESHOLD_MS || '1500', 10);

const attachRequestContext = (req, res, next) => runWithRequestContext(req, res, next);

const requestLogger = (req, res, next) => {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        const requestMeta = {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl || req.url,
            statusCode: res.statusCode,
            durationMs: Number(durationMs.toFixed(2)),
            ip: req.ip || req.socket?.remoteAddress,
            userId: req.user?._id?.toString?.(),
            userAgent: req.headers['user-agent'],
        };

        logger.info('request.completed', requestMeta);

        if (res.statusCode >= 500 || durationMs >= SLOW_REQUEST_THRESHOLD_MS) {
            emitMonitoringEvent('http.request.observed', {
                ...requestMeta,
                severity: res.statusCode >= 500 ? 'error' : 'warning',
                reason: res.statusCode >= 500 ? 'server_error' : 'slow_request',
            });
        }
    });

    next();
};

module.exports = {
    attachRequestContext,
    requestLogger,
};
