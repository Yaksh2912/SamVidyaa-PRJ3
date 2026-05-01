const crypto = require('crypto');

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;

let cachedKeys = null;
let cachedKeysExpiresAt = 0;

const getGoogleClientId = () => (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();

const createAuthError = (message, statusCode = 401, details = {}) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.details = details;
    return error;
};

const decodeBase64UrlJson = (value) => {
    try {
        const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
    } catch (error) {
        throw createAuthError('Invalid Google credential', 401, { cause: error.message });
    }
};

const fetchGoogleKeys = async () => {
    if (cachedKeys && Date.now() < cachedKeysExpiresAt) {
        return cachedKeys;
    }

    let response;
    try {
        response = await fetch(GOOGLE_JWKS_URL);
    } catch (error) {
        throw createAuthError('Unable to reach Google signing keys', 503, { cause: error.message });
    }

    if (!response.ok) {
        throw createAuthError('Failed to fetch Google signing keys', 503, { status: response.status });
    }

    const data = await response.json();
    cachedKeys = Array.isArray(data.keys) ? data.keys : [];
    cachedKeysExpiresAt = Date.now() + JWKS_CACHE_TTL_MS;
    return cachedKeys;
};

const verifySignature = async ({ signingInput, signature, header }) => {
    const keys = await fetchGoogleKeys();
    const jwk = keys.find((key) => key.kid === header.kid && key.kty === 'RSA');

    if (!jwk) {
        throw createAuthError('Google signing key not found', 503, { keyId: header.kid });
    }

    const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(signingInput);
    verifier.end();

    return verifier.verify(publicKey, Buffer.from(signature.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
};

const verifyGoogleIdToken = async (idToken) => {
    const clientId = getGoogleClientId();
    if (!clientId) {
        throw createAuthError('Google sign-in is not configured', 503);
    }

    const parts = String(idToken || '').split('.');
    if (parts.length !== 3) {
        throw createAuthError('Invalid Google credential');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const header = decodeBase64UrlJson(encodedHeader);
    const payload = decodeBase64UrlJson(encodedPayload);

    if (header.alg !== 'RS256') {
        throw createAuthError('Google credential algorithm is invalid', 401, { algorithm: header.alg });
    }

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const isSignatureValid = await verifySignature({
        signingInput,
        signature: encodedSignature,
        header,
    });

    if (!isSignatureValid) {
        throw createAuthError('Invalid Google credential signature', 401, { keyId: header.kid });
    }

    const now = Math.floor(Date.now() / 1000);
    if (!GOOGLE_ISSUERS.has(payload.iss)) {
        throw createAuthError('Google credential issuer is invalid', 401, { issuer: payload.iss });
    }

    if (payload.aud !== clientId) {
        throw createAuthError('Google credential audience does not match server client ID', 401, {
            tokenAudienceSuffix: String(payload.aud || '').slice(-32),
            serverClientIdSuffix: clientId.slice(-32),
        });
    }

    if (Number(payload.exp) <= now) {
        throw createAuthError('Google credential has expired');
    }

    if (!payload.email_verified) {
        throw createAuthError('Google account email is not verified');
    }

    if (!payload.email) {
        throw createAuthError('Google credential email is missing');
    }

    return {
        email: payload.email,
        name: payload.name || payload.email?.split('@')[0],
        picture: payload.picture,
        googleId: payload.sub,
    };
};

module.exports = {
    verifyGoogleIdToken,
};
