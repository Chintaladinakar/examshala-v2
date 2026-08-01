import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { jsonOk, jsonError } from '@/lib/school/http';
import { setAuthCookies, clearAuthCookies } from '@/lib/auth-session';

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(input.length + ((4 - (input.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64');
}

// Verifies an HS256 JWT signature using the shared JWT_SECRET, without pulling in a full
// JWT library on the frontend. Rejects anything that isn't a validly signed token issued
// by the backend so an attacker can't get an arbitrary cookie value written server-side.
function isValidJwtSignature(token: string, secret: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    const header = JSON.parse(base64UrlDecode(headerB64).toString('utf8'));
    if (header.alg !== 'HS256') return false;
  } catch {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const actualSignature = base64UrlDecode(signatureB64);

  if (expectedSignature.length !== actualSignature.length) return false;
  return crypto.timingSafeEqual(expectedSignature, actualSignature);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body?.token === 'string' ? body.token : null;
  const refreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken : null;

  if (!token || !refreshToken) {
    return jsonError('MISSING_TOKEN', 'A token and refreshToken are required', 400);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || !isValidJwtSignature(token, jwtSecret)) {
    return jsonError('INVALID_TOKEN', 'Invalid session token', 401);
  }

  // The refresh token is opaque (not a JWT) — we can't verify it locally, only trust it because
  // it's paired with an access token whose signature we just checked, both minted together by
  // the same signin/signup/refresh response.
  await setAuthCookies(token, refreshToken);

  return jsonOk({ success: true });
}

export async function DELETE() {
  // Revoke server-side so the refresh token can't be replayed after logout, not just forgotten
  // client-side. Best-effort: if the backend call fails, the cookies are cleared regardless.
  try {
    const refreshToken = (await cookies()).get('refresh_token')?.value || null;
    if (refreshToken) {
      await fetch(`${BACKEND_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      });
    }
  } catch {
    // Ignore — cookies are cleared below regardless of whether server-side revocation succeeded.
  }

  await clearAuthCookies();
  return jsonOk({ success: true });
}
