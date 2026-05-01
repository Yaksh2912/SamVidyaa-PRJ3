const test = require('node:test');
const assert = require('node:assert/strict');

const { verifyGoogleIdToken } = require('../services/googleAuthService');

test('verifyGoogleIdToken rejects malformed credentials as unauthorized', async () => {
    const previousClientId = process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

    try {
        await assert.rejects(
            () => verifyGoogleIdToken('not-a-jwt'),
            (error) => {
                assert.equal(error.statusCode, 401);
                assert.equal(error.message, 'Invalid Google credential');
                return true;
            }
        );
    } finally {
        if (previousClientId === undefined) {
            delete process.env.GOOGLE_CLIENT_ID;
        } else {
            process.env.GOOGLE_CLIENT_ID = previousClientId;
        }
    }
});
