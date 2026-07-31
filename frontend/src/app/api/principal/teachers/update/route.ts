import { NextRequest } from 'next/server';
import { jsonError } from '@/lib/school/http';
import { proxyToBackend } from '@/lib/school/backend-proxy';

export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    teacherId?: string;
    action?: 'toggle_status' | 'update_profile' | 'assign_classes_subjects';
    isActive?: boolean;
    name?: string;
    email?: string;
    subjectIds?: string[];
    classIds?: string[];
  };

  const { teacherId, action, ...rest } = body;
  if (!teacherId) return jsonError('BAD_REQUEST', 'teacherId is required', 400);

  const pathByAction: Record<string, string> = {
    toggle_status: `/api/school/teachers-directory/${encodeURIComponent(teacherId)}/status`,
    update_profile: `/api/school/teachers-directory/${encodeURIComponent(teacherId)}/profile`,
    assign_classes_subjects: `/api/school/teachers-directory/${encodeURIComponent(teacherId)}/assignments`,
  };

  const path = action ? pathByAction[action] : undefined;
  if (!path) return jsonError('BAD_REQUEST', 'Unknown action', 400);

  return proxyToBackend(req, path, { method: 'PATCH', body: rest });
}
