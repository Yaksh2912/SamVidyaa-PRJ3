const User = require('../models/User');
const { findAnalyticsProfileByEmail } = require('./analyticsProfileService');

function normalizeRole(role, fallback = 'STUDENT') {
    let normalizedRole = role ? role.toUpperCase() : fallback;

    if (normalizedRole === 'TEACHER') {
        normalizedRole = 'INSTRUCTOR';
    }

    return normalizedRole;
}

async function resolveUsername(email, preferredUsername, options = {}) {
    const { allowSuffixForPreferred = false } = options;
    let username = (preferredUsername || '').trim();

    if (!username) {
        username = email.split('@')[0];
    }

    const existingExactUsername = await User.findOne({ username });
    if (!existingExactUsername) {
        return username;
    }

    if (preferredUsername && !allowSuffixForPreferred) {
        const error = new Error('Username already taken');
        error.statusCode = 400;
        throw error;
    }

    const baseUsername = username;
    let suffix = 1000;

    while (await User.findOne({ username: `${baseUsername}${suffix}` })) {
        suffix += 1;
    }

    return `${baseUsername}${suffix}`;
}

async function createUserAccount({
    name,
    email,
    password,
    role = 'STUDENT',
    username,
    institution,
    enrollment_number,
}) {
    const userExists = await User.findOne({ email });
    if (userExists) {
        const error = new Error('User already exists');
        error.statusCode = 400;
        throw error;
    }

    const analyticsProfile = await findAnalyticsProfileByEmail(email);
    const assignedRole = normalizeRole(role);
    if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(assignedRole)) {
        const error = new Error('Invalid role');
        error.statusCode = 400;
        throw error;
    }

    const resolvedUsername = await resolveUsername(email, username || analyticsProfile?.username, {
        allowSuffixForPreferred: Boolean(!username && analyticsProfile?.username),
    });

    return User.create({
        name: analyticsProfile?.name || name,
        email,
        password,
        role: assignedRole,
        username: resolvedUsername,
        institution: analyticsProfile?.institution || institution,
        enrollment_number: analyticsProfile?.enrollment_number || enrollment_number,
        section: analyticsProfile?.section,
        points: analyticsProfile?.points,
        last_login: analyticsProfile?.last_login,
        analytics_user_id: analyticsProfile?.analytics_user_id,
        analytics_source: analyticsProfile?.analytics_source,
        analytics_synced_at: analyticsProfile?.analytics_synced_at,
    });
}

module.exports = {
    normalizeRole,
    resolveUsername,
    createUserAccount,
};
