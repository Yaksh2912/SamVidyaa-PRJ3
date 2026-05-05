const { captureError } = require('../services/monitoringService');
const { logger } = require('../utils/logger');

function notFound(req, _res, next) {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
}

function errorHandler(err, req, res, _next) {
    const statusCode = err.statusCode || err.status || 500;

    if (statusCode >= 500) {
        logger.error('request.failed', {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            userId: req.user?._id?.toString?.(),
            statusCode,
            error: {
                message: err.message,
                stack: err.stack,
                code: err.code,
            },
        });
        captureError(err, {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            userId: req.user?._id?.toString?.(),
            statusCode,
        });
    }

    res.status(statusCode).json({
        message: err.message || 'Internal server error',
        requestId: req.requestId,
    });
}

module.exports = {
    notFound,
    errorHandler,
};
