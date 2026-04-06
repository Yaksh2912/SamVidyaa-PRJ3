const User = require('../models/User');

function normalizeRole(role, fallback = 'STUDENT') {
    let normalizedRole = role ? role.toUpperCase() : fallback;

    if (normalizedRole === 'TEACHER') {
        normalizedRole = 'INSTRUCTOR';
    }

    return normalizedRole;
}

async function resolveUsername(email, preferredUsername) {
    let username = (preferredUsername || '').trim();

    if (!username) {
        username = email.split('@')[0];
    }

    const existingExactUsername = await User.findOne({ username });
    if (!existingExactUsername) {
        return username;
    }

    if (preferredUsername) {
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

    const assignedRole = normalizeRole(role);
    if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(assignedRole)) {
        const error = new Error('Invalid role');
        error.statusCode = 400;
        throw error;
    }

    const resolvedUsername = await resolveUsername(email, username);

    return User.create({
        name,
        email,
        password,
        role: assignedRole,
        username: resolvedUsername,
        institution,
        enrollment_number,
    });
}

module.exports = {
    normalizeRole,
    resolveUsername,
    createUserAccount,
};
