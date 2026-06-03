'use client';

import React, { useEffect, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import {
  StatCard,
  PendingGradingCard,
  UpcomingClassesCard,
  AnnouncementsCard,
  AttendanceSummaryCard,
  AssignmentAnalyticsCard,
  CalendarWidget,
  PerformanceOverviewCard,
  RecentActivityFeed,
  WorkspaceOverviewCard,
  TeacherActivitySummaryCard,
  StatSkeleton,
  CardSkeleton,
  PerformanceOverviewSkeleton,
  WorkspaceSetupChecklist
} from '@/components/teacher/DashboardWidgets';
import {
  Users,
  GraduationCap,
  ClipboardList,
  AlertCircle,
  Bell,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || 'Server request failed');
  }
  return body.data as T;
}

export default function PrincipalDashboardPage() {
  const { user: profile, loading: profileLoading } = useUser();
  const { showError } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Derive Roles
  const isPrincipal = profile?.role?.toLowerCase() === 'principal';
  const inPrincipalMode = isPrincipal && profile?.mode === 'principal';

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await apiFetch<any>('/api/tutor/dashboard');
      setData(dashboardData);
    } catch (e: any) {
      setError(e.message || 'Failed to sync dashboard analytics');
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  const handlePostAnnouncement = async (announcementData: { title: string; message: string }) => {
    const res = await fetch('/api/tutor/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(announcementData),
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      throw new Error(body.error?.message || 'Failed to post announcement');
    }
    // Refresh dashboard state
    await loadDashboardData();
  };

  useEffect(() => {
    if (!profileLoading) {
      if (!profile) {
        router.push('/signin');
      } else if (!profile.workspaceId && profile.role !== 'superadmin') {
        router.push('/workspace/onboarding');
      } else {
        loadDashboardData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoading, profile?.mode, profile?.workspaceId]);

  // Handle Review action
  const handleReviewSubmission = (id: string) => {
    alert(`Navigating to assessment evaluation workspace for ID: ${id}`);
  };

  // Date formulation
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const initials = profile?.name
    ? profile.name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'P';

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Dark teal premium Sidebar */}
      <DashboardSidebar />

      {/* Main Dashboard Panel */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* ── Header Section ── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none pb-4 border-b border-slate-200/60">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  Welcome back, {profile?.name || 'Principal'} 👋
                </h1>
                
                {/* Dynamic Role Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-violet-500/10 text-violet-700 border-violet-200">
                  <Sparkles className="w-3 h-3 text-current animate-pulse" />
                  Principal
                </span>
              </div>
              <p className="text-slate-500 text-xs md:text-sm mt-1 font-semibold">
                Current Date: <span className="text-slate-700 font-bold">{formattedDate}</span>
              </p>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="p-2 border border-slate-200 hover:bg-slate-100/80 rounded-xl text-slate-500 transition-all cursor-pointer disabled:opacity-50"
                title="Sync Dashboard Analytics"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button className="relative p-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-500 transition-all cursor-pointer select-none">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>

              <div className="h-8 w-px bg-slate-200"></div>

              {/* Header profile view link */}
              <Link href="/profile" className="flex items-center gap-2.5 pl-1.5 py-1 px-2.5 hover:bg-slate-100/80 border border-transparent hover:border-slate-200/40 rounded-xl transition-all select-none">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 border border-indigo-500/20 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {initials}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-black text-slate-800 leading-none">{profile?.name || 'Principal'}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{profile?.role || 'Administrator'}</p>
                </div>
              </Link>
            </div>
          </div>

          {/* ── Loading Skeleton State ── */}
          {loading && (
            <div className="space-y-8 select-none">
              <div className="h-28 bg-slate-100 border border-slate-200/30 rounded-3xl animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[...Array(4)].map((_, idx) => (
                  <StatSkeleton key={idx} />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
                <div className="space-y-6">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              </div>
              <PerformanceOverviewSkeleton />
            </div>
          )}

          {/* ── Error boundary fallback ── */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-rose-100 shadow-3xs select-none max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-800">Connection Error</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">{error}</p>
              <button
                onClick={loadDashboardData}
                className="mt-5 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-sync Dashboard
              </button>
            </div>
          )}

          {/* ── Main Dashboard Content ── */}
          {!loading && !error && data && (
            <div className="space-y-8">
              
              {/* Principal workspace overview banner */}
              {data.workspaceOverview && (
                <WorkspaceOverviewCard stats={data.workspaceOverview} />
              )}

              {/* Workspace onboarding setup checklist (only shows for new workspaces) */}
              {data.workspaceOverview && (
                <WorkspaceSetupChecklist stats={data.workspaceOverview} />
              )}

              {/* ── 4 Quick Stats Row ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                  title="Total Classes"
                  value={data.stats.assignedClasses}
                  icon={GraduationCap}
                />
                <StatCard
                  title="Total Students"
                  value={data.stats.assignedStudents}
                  icon={Users}
                />
                <StatCard
                  title="Assignments Created"
                  value={data.stats.totalAssignments}
                  icon={ClipboardList}
                />
                <StatCard
                  title="Pending Evaluations"
                  value={data.stats.pendingGrading}
                  icon={AlertCircle}
                  isHighlighted={true} // Highlighting the Pending grading stat
                />
              </div>

              {/* ── Main Dashboard Grid ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column (Covers 2 sections out of 3 on large screens) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Pending evaluations registry */}
                  <PendingGradingCard
                    items={data.pendingGradingList}
                    onReview={handleReviewSubmission}
                  />

                  {/* Dynamic timetables */}
                  <UpcomingClassesCard timetable={data.upcomingClasses} />

                  {/* Bulletins Bulletin */}
                  <AnnouncementsCard
                    announcements={data.announcements}
                    isPrincipal={true}
                    onPublish={handlePostAnnouncement}
                  />

                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  
                  {/* Mini Calendar Scheduler */}
                  <CalendarWidget />

                  {/* Attendance ring summary */}
                  <AttendanceSummaryCard stats={data.attendanceSummary} />

                  {/* Coursework status visualizer */}
                  <AssignmentAnalyticsCard stats={data.assignmentAnalytics} />

                  {/* Audit Logs activities timeline */}
                  <RecentActivityFeed feed={data.recentActivityFeed} />

                </div>

              </div>

              {/* ── Performance Analytics Registry ── */}
              <PerformanceOverviewCard overview={data.performanceOverview} />

              {/* Principal-only Teacher Activity Summary Table */}
              {data.teacherActivitySummary && (
                <TeacherActivitySummaryCard teachers={data.teacherActivitySummary} />
              )}

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
