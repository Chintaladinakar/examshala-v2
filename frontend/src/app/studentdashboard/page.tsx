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
    const response = await fetch('http://localhost:5000/api/student/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        authFailed = true;
      } else {
        const errText = await response.text();
        throw new Error(`Failed to fetch dashboard data: ${response.status} - ${errText}`);
      }
    } else {
      const payload = await response.json();
      dashboardData = payload.data;
    }
  } catch (error: any) {
    console.error('API Error:', error.message);
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-white rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-700 mb-2">Service Unavailable</h2>
        <p>Could not load the dashboard data. Please ensure your backend is accessible.</p>
        <p className="text-sm mt-2 font-mono text-rose-500">{error.message}</p>
      </div>
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
  const rawNotifications = (pendingWork?.groupedNotifications && pendingWork.groupedNotifications['exam_assigned']) || [];
  const pendingItems = rawNotifications.map((notif: any) => ({
    id: notif.actionUrl ? notif.actionUrl.split('/').pop() : notif.id,
    title: notif.title,
    message: notif.message,
    assignedByType: "system", // Usually mapped via action if needed
    assignedByName: "Examshala System",
    assignedAt: notif.createdAt
  }));

  // Count anything unread that isn't functionally mapped as 'pending work'
  const unreadCount = Object.values(pendingWork?.groupedNotifications || {}).flat().length - pendingItems.length;

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
