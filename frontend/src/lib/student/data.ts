import { fetchJson } from '@/lib/api';
import { logDeveloperError } from '@/lib/error-handler';
import type { StudentDashboardData, StudentParentsData, StudentResultsData } from '@/lib/student/types';

type DashboardResponse = { data?: StudentDashboardData };
type ParentsResponse = { data?: StudentParentsData };

const isFallbackId = (id?: string) =>
  id === 'edusphere-academy' || id === 'greenwood-high' || id === 'vanguard-science';

const emptyDashboardData: StudentDashboardData = {
  profile: { name: 'Student' },
  stats: { totalExamsTaken: 0, averageScore: 0, rank: undefined, percentile: undefined },
  pendingWork: { groupedNotifications: {} },
  upcomingExams: [],
  recentResults: [],
  workspaceName: 'Student Portal',
};

export async function getStudentDashboard(token: string, workspaceId?: string): Promise<StudentDashboardData> {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (workspaceId && !isFallbackId(workspaceId)) {
      headers['x-workspace-id'] = workspaceId;
    }
    const payload = await fetchJson<DashboardResponse>('/api/student/dashboard', {
      headers,
      cache: 'no-store',
      action: 'load',
    });
    return payload.data ?? emptyDashboardData;
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'student_dashboard_adapter' });
    return emptyDashboardData;
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

export async function getStudentSchedule(token: string, workspaceId?: string): Promise<any> {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (workspaceId && !isFallbackId(workspaceId)) {
      headers['x-workspace-id'] = workspaceId;
    }
    const payload = await fetchJson<{ success?: boolean; data?: any }>('/api/student/schedule', {
      headers,
      cache: 'no-store',
      action: 'load',
    });
    return payload.data ?? { events: [], stats: { upcomingExamsCount: 0, pendingAssignmentsCount: 0, nextLiveSession: null } };
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'student_schedule_adapter' });
    return { events: [], stats: { upcomingExamsCount: 0, pendingAssignmentsCount: 0, nextLiveSession: null } };
  }
}

export type StudentCalendarEvent = {
  id: string;
  type: 'assignment_due' | 'exam' | 'announcement';
  title: string;
  date: string;
  classId?: string;
  className?: string;
};

export async function getStudentCalendarEvents(
  token: string,
  workspaceId?: string,
  params?: { year?: number; month?: number }
): Promise<StudentCalendarEvent[]> {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (workspaceId && !isFallbackId(workspaceId)) {
      headers['x-workspace-id'] = workspaceId;
    }
    const query = new URLSearchParams();
    if (params?.year) query.set('year', String(params.year));
    if (params?.month) query.set('month', String(params.month));
    const qs = query.toString();
    const payload = await fetchJson<{ success?: boolean; data?: StudentCalendarEvent[] }>(
      `/api/student/calendar${qs ? `?${qs}` : ''}`,
      { headers, cache: 'no-store', action: 'load' }
    );
    return Array.isArray(payload.data) ? payload.data : [];
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'student_calendar_adapter' });
    return [];
  }
}

export type StudentAnnouncement = {
  id: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  createdAt: string;
};

export async function getStudentAnnouncements(
  token: string,
  workspaceId?: string,
  search?: string
): Promise<StudentAnnouncement[]> {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (workspaceId && !isFallbackId(workspaceId)) {
      headers['x-workspace-id'] = workspaceId;
    }
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    const payload = await fetchJson<{ success?: boolean; data?: StudentAnnouncement[] }>(
      `/api/student/announcements${qs}`,
      { headers, cache: 'no-store', action: 'load' }
    );
    return Array.isArray(payload.data) ? payload.data : [];
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'student_announcements_adapter' });
    return [];
  }
}

export type StudentSearchResults = {
  materials: Array<{ id: string; title: string; subject: string; type: string }>;
  assignments: Array<{ id: string; title: string; dueDate: string }>;
  exams: Array<{ id: string; title: string; examType: string }>;
  announcements: Array<{ id: string; title: string; createdAt: string }>;
};

const emptySearchResults: StudentSearchResults = { materials: [], assignments: [], exams: [], announcements: [] };

export async function getStudentGlobalSearch(
  token: string,
  workspaceId: string | undefined,
  q: string
): Promise<StudentSearchResults> {
  if (!q.trim()) return emptySearchResults;
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (workspaceId && !isFallbackId(workspaceId)) {
      headers['x-workspace-id'] = workspaceId;
    }
    const payload = await fetchJson<{ success?: boolean; data?: StudentSearchResults }>(
      `/api/student/search?q=${encodeURIComponent(q)}`,
      { headers, cache: 'no-store', action: 'load' }
    );
    return payload.data ?? emptySearchResults;
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'student_search_adapter' });
    return emptySearchResults;
  }
}

export type StudentLeaderboardData = {
  rankings: Array<{ studentId: string; name: string; averageScore: number; rank: number }>;
  myRank: { studentId: string; name: string; averageScore: number; rank: number } | null;
};

export async function getStudentLeaderboard(token: string, workspaceId?: string): Promise<StudentLeaderboardData> {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (workspaceId && !isFallbackId(workspaceId)) {
      headers['x-workspace-id'] = workspaceId;
    }
    const payload = await fetchJson<{ success?: boolean; data?: StudentLeaderboardData }>('/api/student/leaderboard', {
      headers,
      cache: 'no-store',
      action: 'load',
    });
    return payload.data ?? { rankings: [], myRank: null };
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'student_leaderboard_adapter' });
    return { rankings: [], myRank: null };
  }
}

export type StudentSubject = {
  id: string;
  name: string;
  code?: string | null;
  departmentId?: string | null;
  teachers: Array<{ id: string; name: string; email: string }>;
  classes: Array<{ id: string; name: string }>;
};

export async function getStudentSubjects(token: string, workspaceId?: string): Promise<StudentSubject[]> {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (workspaceId && !isFallbackId(workspaceId)) {
      headers['x-workspace-id'] = workspaceId;
    }
    const payload = await fetchJson<{ success?: boolean; data?: StudentSubject[] }>('/api/student/subjects', {
      headers,
      cache: 'no-store',
      action: 'load',
    });
    return Array.isArray(payload.data) ? payload.data : [];
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'student_subjects_adapter' });
    return [];
  }
}

export type StudentTimetableSlot = {
  id: string;
  classId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  meetingUrl?: string | null;
  Subject?: { id: string; name: string } | null;
  Teacher?: { id: string; name: string } | null;
  Class?: { id: string; name: string } | null;
};

export async function getStudentTimetable(token: string, workspaceId?: string): Promise<StudentTimetableSlot[]> {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (workspaceId && !isFallbackId(workspaceId)) {
      headers['x-workspace-id'] = workspaceId;
    }
    const payload = await fetchJson<{ success?: boolean; data?: StudentTimetableSlot[] }>('/api/student/timetable', {
      headers,
      cache: 'no-store',
      action: 'load',
    });
    return Array.isArray(payload.data) ? payload.data : [];
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'student_timetable_adapter' });
    return [];
  }
}

export async function getStudentNotifications(token: string, workspaceId?: string): Promise<any[]> {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (workspaceId && !isFallbackId(workspaceId)) {
      headers['x-workspace-id'] = workspaceId;
    }
    const payload = await fetchJson<{ success?: boolean; data?: any[] }>('/api/student/notifications', {
      headers,
      cache: 'no-store',
      action: 'load',
    });
    return Array.isArray(payload.data) ? payload.data : [];
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'student_notifications_adapter' });
    return [];
  }
}

export async function getStudentAttendance(token: string, workspaceId?: string): Promise<any> {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (workspaceId && !isFallbackId(workspaceId)) {
      headers['x-workspace-id'] = workspaceId;
    }
    const payload = await fetchJson<{ success?: boolean; data?: any }>('/api/student/attendance', {
      headers,
      cache: 'no-store',
      action: 'load',
    });
    return payload.data ?? { overallAttendanceRate: null, totalRecords: 0, totalPresent: 0, totalAbsent: 0, byClass: [], records: [] };
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'student_attendance_adapter' });
    return { overallAttendanceRate: null, totalRecords: 0, totalPresent: 0, totalAbsent: 0, byClass: [], records: [] };
  }
}

export async function getStudentProfile(token: string, workspaceId?: string): Promise<any> {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (workspaceId && !isFallbackId(workspaceId)) {
      headers['x-workspace-id'] = workspaceId;
    }
    const payload = await fetchJson<{ success?: boolean; data?: any }>('/api/student/profile', {
      headers,
      cache: 'no-store',
      action: 'load',
    });
    return payload.data;
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'student_profile_adapter' });
    return null;
  }
}

export async function getStudentSettings(token: string, workspaceId?: string): Promise<any> {
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (workspaceId && !isFallbackId(workspaceId)) {
      headers['x-workspace-id'] = workspaceId;
    }
    const payload = await fetchJson<{ success?: boolean; data?: any }>('/api/student/settings', {
      headers,
      cache: 'no-store',
      action: 'load',
    });
    return payload.data;
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'student_settings_adapter' });
    return null;
  }
}

