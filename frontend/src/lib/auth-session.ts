import { cookies } from 'next/headers';

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

// Must track the backend's real token lifetimes (src/lib/jwt.ts JWT_EXPIRES_IN default and
// src/lib/refreshToken.ts REFRESH_TOKEN_TTL_MS) — these are just how long the *cookies*
// persist client-side; the backend is the actual source of truth for validity.
const ACCESS_COOKIE_MAX_AGE = 15 * 60; // 15 minutes
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

function isProd() {
  return process.env.NODE_ENV === 'production';
}

export async function setAuthCookies(token: string, refreshToken: string) {
  const store = await cookies();
  store.set('session_token', token, {
    path: '/',
    maxAge: ACCESS_COOKIE_MAX_AGE,
    httpOnly: true,
    secure: isProd(),
    sameSite: 'strict',
  });
  // Scoped to /api/auth so it's only ever sent to the refresh/logout routes that need it,
  // not attached to every request the way session_token is.
  store.set('refresh_token', refreshToken, {
    path: '/api/auth',
    maxAge: REFRESH_COOKIE_MAX_AGE,
    httpOnly: true,
    secure: isProd(),
    sameSite: 'strict',
  });
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.set('session_token', '', { path: '/', maxAge: 0, httpOnly: true, secure: isProd(), sameSite: 'strict' });
  store.set('refresh_token', '', { path: '/api/auth', maxAge: 0, httpOnly: true, secure: isProd(), sameSite: 'strict' });
}

/**
 * Exchanges the refresh_token cookie for a new access token, rotating the refresh token in
 * the process. Used both by the explicit POST /api/auth/refresh route and transparently by
 * the generic backend proxy when a request comes back 401 with an expired access token.
 * Returns the new access token, or null (having cleared the auth cookies) on failure.
 */
export async function tryRefreshAccessToken(): Promise<string | null> {
  const store = await cookies();
  const refreshToken = store.get('refresh_token')?.value;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
    if (!res.ok) {
      await clearAuthCookies();
      return null;
    }
    const body = await res.json().catch(() => null);
    const newToken = body?.data?.token;
    const newRefreshToken = body?.data?.refreshToken;
    if (!newToken || !newRefreshToken) {
      await clearAuthCookies();
      return null;
    }
    await setAuthCookies(newToken, newRefreshToken);
    return newToken;
  } catch {
    // Network failure talking to the backend — leave cookies as-is so a transient blip
    // doesn't force a full sign-out; the caller treats this the same as "refresh unavailable".
    return null;
  }
}
