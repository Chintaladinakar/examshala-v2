import crypto from 'crypto';

// Refresh tokens are opaque (not JWTs) and stored server-side as a salted-free SHA-256 hash —
// only the hash lives in the DB, so a leaked database dump can't be replayed as a live session.
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
