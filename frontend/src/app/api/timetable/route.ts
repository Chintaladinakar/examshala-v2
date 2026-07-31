import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId') || '';
  return proxyToBackend(req, `/api/school/timetable/class/${encodeURIComponent(classId)}`, { method: 'GET' });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(req, '/api/school/timetable', { method: 'POST', body });
}
