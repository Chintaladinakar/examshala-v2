import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = searchParams.get('classId') || '';
  const year = searchParams.get('year') || '';
  const month = searchParams.get('month') || '';
  return proxyToBackend(
    req,
    `/api/school/attendance/report?classId=${encodeURIComponent(classId)}&year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`,
    { method: 'GET' }
  );
}
