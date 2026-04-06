const parsePositiveInt = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parsePagination = (req, { defaultLimit = 50, maxLimit = 100 } = {}) => {
    const page = parsePositiveInt(req.query?.page) || 1;
    const requestedLimit = parsePositiveInt(req.query?.limit);
    const limit = Math.min(requestedLimit || defaultLimit, maxLimit);
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
    };
};

const applyPaginationHeaders = (res, { page, limit, total }) => {
    const safeTotal = Number.isFinite(total) && total >= 0 ? total : 0;
    const totalPages = safeTotal === 0 ? 0 : Math.ceil(safeTotal / limit);

    res.setHeader('X-Page', String(page));
    res.setHeader('X-Limit', String(limit));
    res.setHeader('X-Total-Count', String(safeTotal));
    res.setHeader('X-Total-Pages', String(totalPages));
    res.setHeader('X-Has-More', page < totalPages ? 'true' : 'false');
};

module.exports = {
    applyPaginationHeaders,
    parsePagination,
};
