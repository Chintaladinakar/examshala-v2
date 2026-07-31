import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { jsonOk, jsonError } from '@/lib/school/http';

const SESSION_COOKIE_MAX_AGE = 86400; // 24h, matches backend JWT usage elsewhere in the app

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

  if (!token) {
    return jsonError('MISSING_TOKEN', 'A token is required', 400);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || !isValidJwtSignature(token, jwtSecret)) {
    return jsonError('INVALID_TOKEN', 'Invalid session token', 401);
  }

  (await cookies()).set('session_token', token, {
    path: '/',
    maxAge: SESSION_COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return jsonOk({ success: true });
}

export async function DELETE() {
  (await cookies()).set('session_token', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return jsonOk({ success: true });
}
