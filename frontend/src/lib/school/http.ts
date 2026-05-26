import { NextResponse } from 'next/server';

export function jsonOk(data: unknown, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function jsonError(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export function mapAuthzError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  switch (msg) {
    case 'UNAUTHORIZED':
      return jsonError('UNAUTHORIZED', 'Unauthorized', 401);
    case 'FORBIDDEN':
      return jsonError('FORBIDDEN', 'Forbidden', 403);
    case 'NO_WORKSPACE':
      return jsonError('NO_WORKSPACE', 'No workspace selected', 400);
    default:
      return jsonError('BAD_REQUEST', 'Request failed', 400);
  }
}

