import React, { Suspense } from 'react';
import nextDynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ExamsSkeleton } from '@/components/student/ExamsSkeleton';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getStudentDashboard } from '@/lib/student/data';

// Dynamically load the client-interactive exams listing to optimize bundle sizes and TTI
const ExamsListInteractive = nextDynamic(
  () => import('@/components/student/ExamsListInteractive').then((mod) => mod.ExamsListInteractive),
  {
    loading: () => <ExamsSkeleton />,
  }
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentExamsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    redirect('/signin');
  }

  let upcomingExams: any[] = [];
  let recentResults: any[] = [];

  try {
    const dashboardData = await getStudentDashboard(token);
    if (dashboardData) {
      upcomingExams = dashboardData.upcomingExams || [];
      recentResults = dashboardData.recentResults || [];
    }
  } catch (error) {
    console.error('Failed to load dynamic exams:', error);
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header Section */}
      <div className="space-y-1.5 select-none">
        <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">
          <Link href="/studentdashboard" className="hover:text-teal-600 transition-colors">Dashboard</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-500 font-extrabold">Exams</span>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Exams</h1>
        <p className="text-xs md:text-sm text-slate-500">
          View upcoming, live, and practice exams assigned by your organization, track attempts, and review grades.
        </p>
      </div>

      {/* Dynamic Interactive List Container */}
      <Suspense fallback={<ExamsSkeleton />}>
        <ExamsListInteractive initialUpcomingExams={upcomingExams} initialRecentResults={recentResults} />
      </Suspense>
    </div>
  );
}

