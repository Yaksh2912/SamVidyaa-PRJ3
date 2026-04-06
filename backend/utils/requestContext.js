const { AsyncLocalStorage } = require('async_hooks');
const { randomUUID } = require('crypto');

const requestContextStorage = new AsyncLocalStorage();

const normalizeRequestId = (value) => {
    if (!value) return null;

    const requestId = Array.isArray(value) ? value[0] : value;
    const normalized = String(requestId || '').trim();

    if (!normalized) {
        return null;
    }

    return normalized.slice(0, 128);
};

const createRequestContext = (req) => ({
    requestId: normalizeRequestId(req.headers['x-request-id']) || randomUUID(),
    requestStartedAt: Date.now(),
});

const runWithRequestContext = (req, res, next) => {
    const context = createRequestContext(req);
    req.requestId = context.requestId;
    res.setHeader('X-Request-Id', context.requestId);

    requestContextStorage.run(context, () => {
        next();
    });
};

const getRequestContext = () => requestContextStorage.getStore() || {};

module.exports = {
    getRequestContext,
    runWithRequestContext,
};
