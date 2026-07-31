import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId') || '';
  const date = searchParams.get('date') || '';
  return proxyToBackend(
    req,
    `/api/school/attendance/class/${encodeURIComponent(classId)}?date=${encodeURIComponent(date)}`,
    { method: 'GET' }
  );
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    classId?: string;
    date?: string;
    entries?: { studentId: string; status: string }[];
  };
  return proxyToBackend(req, '/api/school/attendance/mark', {
    method: 'POST',
    body: { classId: body.classId, date: body.date, records: body.entries },
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(req, '/api/school/attendance/update', { method: 'PATCH', body });
}
