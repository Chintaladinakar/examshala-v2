import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.search;
  return proxyToBackend(req, `/api/questions${qs}`, { method: 'GET' });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(req, '/api/questions', { method: 'POST', body });
}
