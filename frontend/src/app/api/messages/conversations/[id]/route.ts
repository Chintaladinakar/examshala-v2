import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(req, `/api/messages/conversations/${encodeURIComponent(id)}/messages`, { method: 'GET' });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(req, `/api/messages/conversations/${encodeURIComponent(id)}/messages`, { method: 'POST', body });
}
