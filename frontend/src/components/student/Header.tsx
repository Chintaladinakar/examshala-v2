import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ChevronDown, Building } from 'lucide-react';
import { getStudentDashboard } from '@/lib/student/data';
import { studentDashboardMock } from '@/lib/student/mock';
import { LogoutButton } from '@/components/student/LogoutButton';
import type { StudentDashboardData } from '@/lib/student/types';

export async function Header() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) redirect('/signin');

  // Minimal, production-safe: show a single current workspace label from dashboard data (or fallback).
  // No hardcoded workspace lists in the header UI.
  const dashboardPromise: Promise<StudentDashboardData> = getStudentDashboard(token);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center px-4 md:px-8 justify-between">
      {/* Mobile Branding (only shows on mobile, since sidebar is hidden) */}
      <div className="md:hidden flex items-center gap-2">
        <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl leading-none">E</span>
        </div>
      </div>

      <div className="flex-1 flex justify-center md:justify-start">
        {/* Workspace Switcher */}
        <div className="relative">
          <WorkspaceLabel dashboardPromise={dashboardPromise} />
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        <LogoutButton />
      </div>
    </header>
  );
}

async function WorkspaceLabel({ dashboardPromise }: { dashboardPromise: Promise<StudentDashboardData> }) {
  const dashboard = (await dashboardPromise) ?? studentDashboardMock;
  const workspaceName = typeof dashboard.workspaceName === 'string' ? dashboard.workspaceName : studentDashboardMock.workspaceName;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors">
      <Building className="w-4 h-4 text-slate-500" />
      <span className="text-sm font-medium text-slate-800">{workspaceName}</span>
      <ChevronDown className="w-4 h-4 text-slate-300" />
    </div>
  );
}
