import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { 
  WelcomeBanner, 
  PendingWorkSection, 
  OverallProgressSection, 
  UpcomingExamsSection, 
  RecentResultsSection 
} from '@/components/student/DashboardSections';
import { fetchJson } from '@/lib/api';
import FullPageErrorState from '@/components/ui/FullPageErrorState';
import { logDeveloperError } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    redirect('/signin');
  }

  let dashboardData = null;

  let authFailed = false;

  try {
    const payload = await fetchJson<DashboardResponse>('/api/student/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store',
      action: 'load',
    });
    dashboardData = payload.data ?? null;
  } catch (error: unknown) {
    const errRec = (error && typeof error === 'object') ? (error as Record<string, unknown>) : null;
    let status: number | undefined;
    if (typeof errRec?.status === 'number') status = errRec.status;
    const response = errRec?.response;
    if (!status && response && typeof response === 'object') {
      const rs = (response as Record<string, unknown>).status;
      if (typeof rs === 'number') status = rs;
    }
    if (status === 401 || status === 403) authFailed = true;
    logDeveloperError(error, { action: 'load', feature: 'studentdashboard' });
    return (
      <FullPageErrorState error={error} action="load" title="Service Unavailable" onRetryHref="/studentdashboard" />
    );
  }

  if (authFailed) {
    redirect('/signin');
  }

  if (!dashboardData || !dashboardData.profile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-white rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-700 mb-2">No Profile Found</h2>
        <p>Your student account requires configuration before viewing.</p>
      </div>
    );
  }

  const { profile, stats, pendingWork, upcomingExams, recentResults } = dashboardData;

  // Flatten and map notifications (exam assignments) into actionable pending items
  const rawNotifications =
    (pendingWork?.groupedNotifications && (pendingWork.groupedNotifications as Record<string, unknown>)['exam_assigned']) || [];
  const pendingItems = (Array.isArray(rawNotifications) ? rawNotifications : []).map((notif) => {
    const n = notif && typeof notif === 'object' ? (notif as Record<string, unknown>) : {};
    const actionUrl = typeof n.actionUrl === 'string' ? n.actionUrl : '';
    return {
      id: actionUrl ? actionUrl.split('/').pop() : (typeof n.id === 'string' ? n.id : ''),
      title: typeof n.title === 'string' ? n.title : '',
      message: typeof n.message === 'string' ? n.message : '',
    assignedByType: "system", // Usually mapped via action if needed
    assignedByName: "Examshala System",
      assignedAt: n.createdAt,
    };
  });

  // Count anything unread that isn't functionally mapped as 'pending work'
  const grouped = (pendingWork?.groupedNotifications || {}) as Record<string, unknown>;
  const unreadCount =
    Object.values(grouped).flatMap((v) => (Array.isArray(v) ? v : [])).length - pendingItems.length;

  return (
    <div className="flex flex-col">
      <WelcomeBanner 
        studentName={profile.name}
        workspaceName="Your Dashboard"
        pendingCount={pendingItems.length}
        unreadCount={unreadCount}
      />

      <PendingWorkSection pendingItems={pendingItems} />

      <OverallProgressSection stats={{
        totalExamsTaken: stats?.totalExamsTaken || 0,
        averageScore: stats?.averageScore || 0,
        workspaceCount: 1, 
        trendText: "Active",
        linkedParentCount: stats?.linkedParentCount || 0
      }} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UpcomingExamsSection exams={upcomingExams || []} />
        <RecentResultsSection results={recentResults || []} />
      </div>
    </div>
  );
}
type DashboardResponse = {
  data?: {
    profile?: { name?: string };
    stats?: Record<string, unknown>;
    pendingWork?: Record<string, unknown>;
    upcomingExams?: unknown[];
    recentResults?: unknown[];
  };
};
