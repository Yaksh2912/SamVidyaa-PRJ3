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

        if (recent.length >= max) {
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
