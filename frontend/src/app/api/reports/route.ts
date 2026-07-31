import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const qs = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
  return proxyToBackend(req, `/api/school/reports${qs}`, { method: 'GET' });
}
