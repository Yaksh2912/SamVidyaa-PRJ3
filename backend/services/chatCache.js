/**
 * Simple in-memory LRU cache for chat responses.
 * Prevents redundant API calls for similar/repeated questions.
 * Entries expire after TTL_MS milliseconds.
 */

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 100;

const cache = new Map();

/**
 * Generate a cache key from query + studentId.
 * Normalizes the query to catch near-duplicates.
 */
function makeKey(studentId, query) {
    const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
    return `${studentId}::${normalized}`;
}

/**
 * Get a cached response if it exists and hasn't expired.
 */
function get(studentId, query) {
    const key = makeKey(studentId, query);
    const entry = cache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > TTL_MS) {
        cache.delete(key);
        return null;
    }

    return entry.value;
}

/**
 * Store a response in the cache.
 */
function set(studentId, query, value) {
    const key = makeKey(studentId, query);

    // Evict oldest if at capacity
    if (cache.size >= MAX_ENTRIES) {
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
    }

    cache.set(key, {
        value,
        timestamp: Date.now(),
    });
}

/**
 * Clear all cache entries for a specific student (e.g., when they clear history).
 */
function clearForStudent(studentId) {
    for (const key of cache.keys()) {
        if (key.startsWith(`${studentId}::`)) {
            cache.delete(key);
        }
    }
}

module.exports = { get, set, clearForStudent };
