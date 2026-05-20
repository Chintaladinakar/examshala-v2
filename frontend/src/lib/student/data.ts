import { fetchJson } from '@/lib/api';
import { logDeveloperError } from '@/lib/error-handler';
import type { StudentDashboardData, StudentParentsData, StudentResultsData } from '@/lib/student/types';
import { studentDashboardMock } from '@/lib/student/mock';

type DashboardResponse = { data?: StudentDashboardData };
type ParentsResponse = { data?: StudentParentsData };

export async function getStudentDashboard(token: string): Promise<StudentDashboardData> {
  try {
    const payload = await fetchJson<DashboardResponse>('/api/student/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      action: 'load',
    });
    return payload.data ?? studentDashboardMock;
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'student_dashboard_adapter' });
    return studentDashboardMock;
  }
}

export async function getStudentParents(token: string): Promise<StudentParentsData> {
  try {
    const payload = await fetchJson<ParentsResponse>('/api/student/parents', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      action: 'load',
    });
    return Array.isArray(payload.data) ? payload.data : [];
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'student_parents_adapter' });
    return [];
  }
}

// Results endpoint may vary across deployments; attempt student route first.
export async function getStudentResults(token: string): Promise<StudentResultsData> {
  try {
    const payload = await fetchJson<{ success?: boolean; data?: unknown }>('/api/student/results', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      action: 'load',
    });
    const data = (payload && typeof payload === 'object') ? (payload as Record<string, unknown>).data : undefined;
    return Array.isArray(data) ? (data as unknown[]) : [];
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'student_results_adapter' });
    return [];
  }
}
