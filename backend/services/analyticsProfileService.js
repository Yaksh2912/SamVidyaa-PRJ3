const User = require('../models/User');

const ANALYTICS_DB_NAME = process.env.MONGO_ANALYTICS_DB_NAME || 'samvidya_analytics';
const ANALYTICS_PROFILE_COLLECTIONS = ['students', 'trusted_users'];

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const compactProfile = (profile) => Object.entries(profile).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
    }
    return acc;
}, {});

const mapAnalyticsProfile = (record, collectionName) => compactProfile({
    name: record.fullName || record.name,
    username: record.username,
    institution: record.institution,
    enrollment_number: record.enrollmentNumber || record.enrollment_number,
    section: record.section,
    points: Number.isFinite(Number(record.totalPoints)) ? Number(record.totalPoints) : undefined,
    last_login: record.lastLogin ? new Date(record.lastLogin) : undefined,
    analytics_user_id: record.userId || record.studentId,
    analytics_source: collectionName,
    analytics_synced_at: record.syncedAt ? new Date(record.syncedAt) : new Date(),
});

async function findAnalyticsProfileByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || User.db.readyState !== 1 || !User.db.client) {
        return null;
    }

    const analyticsDb = User.db.client.db(ANALYTICS_DB_NAME);
    const emailRegex = new RegExp(`^${escapeRegExp(normalizedEmail)}$`, 'i');

    for (const collectionName of ANALYTICS_PROFILE_COLLECTIONS) {
        const record = await analyticsDb.collection(collectionName).findOne({ email: emailRegex });
        if (record) {
            return mapAnalyticsProfile(record, collectionName);
        }
    }

    return null;
}

module.exports = {
    findAnalyticsProfileByEmail,
};
