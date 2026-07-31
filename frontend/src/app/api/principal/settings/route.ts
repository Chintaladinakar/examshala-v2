import { NextRequest } from 'next/server';
import { jsonError } from '@/lib/school/http';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const actionType = searchParams.get('actionType');
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (actionType) params.set('actionType', actionType);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return proxyToBackend(req, `/api/school/settings${qs}`, { method: 'GET' });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    entityType?: 'class' | 'subject';
    name?: string;
    departmentId?: string;
  };

  if (body.entityType === 'class') {
    return proxyToBackend(req, '/api/school/classes/create', {
      method: 'POST',
      body: { name: body.name, departmentId: body.departmentId },
    });
  }
  if (body.entityType === 'subject') {
    return proxyToBackend(req, '/api/school/subjects', { method: 'POST', body: { name: body.name } });
  }
  return jsonError('BAD_REQUEST', 'Unknown entityType', 400);
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    action?: 'update_workspace' | 'archive_class';
    workspaceName?: string;
    classId?: string;
  };

  if (body.action === 'update_workspace') {
    return proxyToBackend(req, '/api/school/settings/workspace', { method: 'PATCH', body: { workspaceName: body.workspaceName } });
  }
  if (body.action === 'archive_class') {
    if (!body.classId) return jsonError('BAD_REQUEST', 'classId is required', 400);
    return proxyToBackend(req, `/api/school/classes/${encodeURIComponent(body.classId)}`, { method: 'DELETE' });
  }
  return jsonError('BAD_REQUEST', 'Unknown action', 400);
}
