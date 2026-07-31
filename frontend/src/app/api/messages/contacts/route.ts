import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function GET(req: NextRequest) {
  return proxyToBackend(req, '/api/messages/contacts', { method: 'GET' });
}
