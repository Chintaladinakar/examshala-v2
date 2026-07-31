import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(req, `/api/exams/${encodeURIComponent(id)}`, { method: 'GET' });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(req, `/api/exams/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
