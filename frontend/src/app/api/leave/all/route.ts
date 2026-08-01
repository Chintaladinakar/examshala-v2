import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.search;
  return proxyToBackend(req, `/api/leave/all${qs}`, { method: 'GET' });
}
