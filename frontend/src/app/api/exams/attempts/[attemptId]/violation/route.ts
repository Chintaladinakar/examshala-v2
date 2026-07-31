import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function POST(req: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return proxyToBackend(req, `/api/exams/attempts/${encodeURIComponent(attemptId)}/violation`, { method: 'POST' });
}
