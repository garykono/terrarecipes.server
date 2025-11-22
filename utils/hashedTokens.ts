const crypto = require('crypto');

export const generateToken = ({ 
    milliseconds = 0,
    seconds = 0,
    minutes = 0,
    hours = 0
} = {}) => {
    // total time-to-live in ms
    const ttlMs = (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;

    // create random token
    const rawToken = crypto.randomBytes(32).toString('hex');

    // hash token
    const hashedToken = hashToken(rawToken);

    // expiration time
    const expiresAt = new Date(Date.now() + ttlMs);

    return { rawToken, hashedToken, expiresAt };
}

export const hashToken = (rawToken: string) => crypto.createHash('sha256').update(rawToken).digest('hex');