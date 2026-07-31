import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function GET(req: NextRequest) {
  return proxyToBackend(req, '/api/school/notification-settings', { method: 'GET' });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(req, '/api/school/notification-settings', { method: 'PATCH', body });
}
