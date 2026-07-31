import { NextRequest } from 'next/server';
import { jsonOk, jsonError } from './http';

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Cookie-based auth is CSRF-prone by default: browsers attach cookies to cross-site
// requests automatically. As a defense-in-depth check on top of SameSite=Strict on the
// session cookie, reject state-changing requests whose Origin doesn't match our own host.
function isSameOriginRequest(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // same-site requests often omit Origin; SameSite=Strict is the primary guard
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

export async function proxyToBackend(
  req: NextRequest,
  path: string,
  options: { method: string; body?: unknown }
) {
  if (!SAFE_METHODS.has(options.method.toUpperCase()) && !isSameOriginRequest(req)) {
    return jsonError('FORBIDDEN', 'Cross-origin request rejected', 403);
  }

  const cookie = req.headers.get('cookie') || '';

  const res = await fetch(`${BACKEND_BASE_URL}${path}`, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      cookie,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok || !body?.success) {
    return jsonError(body?.code || 'BACKEND_ERROR', body?.message || 'Request failed', res.status || 500);
  }

  return jsonOk(body.data, { status: res.status });
}
