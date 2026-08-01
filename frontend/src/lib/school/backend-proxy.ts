import { NextRequest } from 'next/server';
import { jsonOk, jsonError } from './http';
import { tryRefreshAccessToken } from '@/lib/auth-session';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

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
  const requestBody = options.body !== undefined ? JSON.stringify(options.body) : undefined;
  // Correlation ID for tracing this request across the proxy hop and into the backend's
  // structured logs (see backend/src/middleware/requestLogger.middleware.ts).
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  const callBackend = (cookieHeader: string) =>
    fetchWithTimeout(`${BACKEND_BASE_URL}${path}`, {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
        'X-Request-Id': requestId,
      },
      body: requestBody,
      cache: 'no-store',
    });

  let res: Response;
  try {
    res = await callBackend(cookie);

    // The access token cookie is short-lived by design — a 401 mid-session most likely means it
    // just expired. Try one silent refresh (which rewrites the cookie for this response) and
    // replay the request with the freshly-issued token before giving up.
    if (res.status === 401) {
      const refreshedToken = await tryRefreshAccessToken();
      if (refreshedToken) {
        res = await callBackend(`session_token=${refreshedToken}`);
      }
    }
  } catch {
    return jsonError('BACKEND_TIMEOUT', 'The server took too long to respond. Please try again.', 504);
  }

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
