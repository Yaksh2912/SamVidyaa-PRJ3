function notFound(req, _res, next) {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
}

function errorHandler(err, req, res, _next) {
    const statusCode = err.statusCode || err.status || 500;

    if (statusCode >= 500) {
        console.error('[ServerError]', {
            method: req.method,
            path: req.originalUrl,
            message: err.message,
        });
    }

    res.status(statusCode).json({
        message: err.message || 'Internal server error',
    });
}

module.exports = {
    notFound,
    errorHandler,
};
