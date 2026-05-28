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

export async function getStudentResults(token: string): Promise<StudentResultsData> {
  try {
    const payload = await fetchJson<{ success?: boolean; data?: unknown }>('/api/results', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = (payload && typeof payload === 'object') ? (payload as Record<string, unknown>).data : undefined;
    return Array.isArray(data) ? (data as any[]) : [];
  } catch (err) {
    console.error("Failed to load results", err);
    return [];
  }
}

export async function getStudentResultById(token: string, id: string): Promise<any> {
  try {
    const payload = await fetchJson<{ success?: boolean; data?: unknown }>(`/api/results/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return (payload && typeof payload === 'object') ? (payload as Record<string, unknown>).data : null;
  } catch (err) {
    console.error("Failed to load result details", err);
    return null;
  }
}

export async function getStudentSchedule(token: string): Promise<any> {
  try {
    const payload = await fetchJson<{ success?: boolean; data?: any }>('/api/student/schedule', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      action: 'load',
    });
    return payload.data ?? { events: [], stats: { upcomingExamsCount: 0, pendingAssignmentsCount: 0, nextLiveSession: null } };
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'student_schedule_adapter' });
    return { events: [], stats: { upcomingExamsCount: 0, pendingAssignmentsCount: 0, nextLiveSession: null } };
  }
}

