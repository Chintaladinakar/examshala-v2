import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function PATCH(req: NextRequest) {
  return proxyToBackend(req, '/api/notifications/read-all', { method: 'PATCH' });
}
