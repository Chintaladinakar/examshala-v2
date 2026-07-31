import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function GET(req: NextRequest) {
  return proxyToBackend(req, '/api/school/classes', { method: 'GET' });
}
