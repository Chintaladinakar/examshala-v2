import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId');
  const qs = departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : '';
  return proxyToBackend(req, `/api/school/subjects${qs}`, { method: 'GET' });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(req, '/api/school/subjects', { method: 'POST', body });
}
