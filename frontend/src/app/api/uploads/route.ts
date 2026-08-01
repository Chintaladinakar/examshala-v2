import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

// Cookie-based auth is CSRF-prone by default: browsers attach cookies to cross-site requests
// automatically. As a defense-in-depth check on top of SameSite=Strict on the session cookie,
// reject uploads whose Origin doesn't match our own host.
function isSameOriginRequest(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch {
    return false;
  }
}

/**
 * Forwards a multipart file upload to the backend's real upload pipeline (magic-byte checked,
 * written to private disk storage — see backend/src/controllers/uploads.controller.ts). Reads
 * the body as raw bytes (not JSON) so the multipart boundary and binary content survive the
 * hop; the generic /api/proxy/* route can't be reused here because it decodes bodies as text.
 */
export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ success: false, code: 'FORBIDDEN', message: 'Cross-origin request rejected' }, { status: 403 });
  }

  const cookie = req.headers.get('cookie') || '';
  const contentType = req.headers.get('content-type') || '';
  const body = await req.arrayBuffer();

  const backendRes = await fetch(`${BACKEND_BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: { 'Content-Type': contentType, cookie },
    body,
    cache: 'no-store',
  });

  const text = await backendRes.text();
  return new NextResponse(text, {
    status: backendRes.status,
    headers: { 'Content-Type': backendRes.headers.get('content-type') || 'application/json' },
  });
}
