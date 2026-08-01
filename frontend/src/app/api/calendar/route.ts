import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year') || String(new Date().getFullYear());
  const month = searchParams.get('month') || String(new Date().getMonth() + 1);
  return proxyToBackend(req, `/api/school/calendar?year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`, { method: 'GET' });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(req, '/api/school/calendar', { method: 'POST', body });
}
