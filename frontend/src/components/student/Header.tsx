import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Building } from 'lucide-react';
import { getStudentDashboard } from '@/lib/student/data';
import { studentDashboardMock } from '@/lib/student/mock';
import { HeaderInteractive } from '@/components/student/HeaderInteractive';
import type { StudentDashboardData } from '@/lib/student/types';

export async function Header() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) redirect('/signin');

  // Load dashboard data on the server
  let dashboardData: StudentDashboardData = studentDashboardMock;
  try {
    dashboardData = await getStudentDashboard(token);
  } catch {
    // Fallback to mock
  }

  const studentName = dashboardData?.profile?.name || 'Student';
  const pendingWork = dashboardData?.pendingWork;
  const rawNotifications =
    (pendingWork?.groupedNotifications && (pendingWork.groupedNotifications as Record<string, unknown>)['exam_assigned']) || [];
  const pendingItems = (Array.isArray(rawNotifications) ? rawNotifications : []);
  
  // Calculate unread notifications
  const grouped = (pendingWork?.groupedNotifications || {}) as Record<string, unknown>;
  const unreadCount =
    Object.values(grouped).flatMap((v) => (Array.isArray(v) ? v : [])).length - pendingItems.length;

  const workspaceName = dashboardData.workspaceName || 'Student Portal';

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 h-16 flex items-center px-4 md:px-8 justify-between shadow-xs">
      {/* Workspace Switcher & Brand Info */}
      <div className="flex items-center gap-3">
        {/* Sleek branding switcher */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 shadow-3xs max-w-[180px] sm:max-w-xs transition-colors hover:border-slate-300">
          <Building className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-wider truncate">{workspaceName}</span>
        </div>
      </div>

      {/* Interactive elements (Search, Notifications, Profile Dropdown, Drawer Menu) */}
      <HeaderInteractive studentName={studentName} unreadCount={unreadCount} />
    </header>
  );
}
