import { NextRequest } from 'next/server';
import { jsonError } from '@/lib/school/http';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { studentId?: string; isActive?: boolean };
  if (!body.studentId || typeof body.isActive !== 'boolean') {
    return jsonError('BAD_REQUEST', 'studentId and isActive required', 400);
  }
  return proxyToBackend(req, '/api/school/users/activate', {
    method: 'PATCH',
    body: { targetUserId: body.studentId, isActive: body.isActive },
  });
}
