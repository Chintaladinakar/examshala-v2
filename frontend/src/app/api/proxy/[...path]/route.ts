import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

/**
 * Generic authenticated reverse proxy from the frontend's own origin to the Express
 * backend. Client components call this same-origin route (so the browser attaches the
 * HttpOnly session cookie automatically); this route reads that cookie server-side and
 * forwards it to the backend as an Authorization header, so client-side JS never needs
 * direct access to the raw token.
 */
async function handle(req: NextRequest, path: string[]): Promise<NextResponse> {
  const method = req.method.toUpperCase();

  if (!SAFE_METHODS.has(method) && !isSameOriginRequest(req)) {
    return NextResponse.json(
      { success: false, code: 'FORBIDDEN', message: 'Cross-origin request rejected' },
      { status: 403 }
    );
  }

  const token = (await cookies()).get('session_token')?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, code: 'NO_TOKEN', message: 'Access denied. No token provided.' },
      { status: 401 }
    );
  }

  const targetPath = `/${path.join('/')}`;
  const search = req.nextUrl.search;
  const body = SAFE_METHODS.has(method) ? undefined : await req.text();

  const backendRes = await fetch(`${BACKEND_BASE_URL}${targetPath}${search}`, {
    method,
    headers: {
      'Content-Type': req.headers.get('content-type') || 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body,
    cache: 'no-store',
  });

  const text = await backendRes.text();
  return new NextResponse(text, {
    status: backendRes.status,
    headers: { 'Content-Type': backendRes.headers.get('content-type') || 'application/json' },
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  return handle(req, (await ctx.params).path);
}
export async function POST(req: NextRequest, ctx: RouteContext) {
  return handle(req, (await ctx.params).path);
}
export async function PUT(req: NextRequest, ctx: RouteContext) {
  return handle(req, (await ctx.params).path);
}
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  return handle(req, (await ctx.params).path);
}
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  return handle(req, (await ctx.params).path);
}
