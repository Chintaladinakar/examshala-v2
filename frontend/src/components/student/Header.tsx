import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getStudentDashboard, getStudentNotifications } from '@/lib/student/data';
import { HeaderInteractive } from '@/components/student/HeaderInteractive';

export async function Header() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  const workspaceId = cookieStore.get('workspace_id')?.value;

  if (!token) redirect('/signin');

  // getStudentDashboard already resolves to a safe empty default on failure
  const [dashboardData, notifications] = await Promise.all([
    getStudentDashboard(token, workspaceId),
    getStudentNotifications(token, workspaceId),
  ]);

  const studentName = dashboardData?.profile?.name || 'Student';
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Provide realistic sample workspaces in development if the student has no workspace memberships
  const fallbackWorkspaces = [
    { id: 'edusphere-academy', name: 'EDUsphere Academy' },
    { id: 'greenwood-high', name: 'Greenwood High School' },
    { id: 'vanguard-science', name: 'Vanguard Science School' }
  ];
  
  const workspaces = (dashboardData.workspaces && dashboardData.workspaces.length > 0)
    ? dashboardData.workspaces
    : fallbackWorkspaces;

  const activeWorkspaceId = dashboardData.activeWorkspaceId || workspaceId || workspaces[0]?.id;
  
  const workspaceName = (dashboardData.workspaces && dashboardData.workspaces.length > 0)
    ? (dashboardData.workspaceName || 'Student Portal')
    : (workspaces.find(w => w.id === activeWorkspaceId)?.name || 'Student Portal');

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 h-16 flex items-center px-4 md:px-8 justify-between shadow-xs w-full">
      <HeaderInteractive
        studentName={studentName}
        unreadCount={unreadCount}
        notifications={notifications}
        activeWorkspaceId={activeWorkspaceId}
        workspaceName={workspaceName}
        workspaces={workspaces}
      />
    </header>
  );
}
