import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(req, '/api/school/classes/assign', { method: 'PATCH', body });
}
