import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyToBackend(req, `/api/school/assignments/submissions/${encodeURIComponent(id)}/plagiarism`, { method: 'PATCH', body });
}
