import React, { Suspense } from 'react';
import nextDynamic from 'next/dynamic';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getStudentSchedule } from '@/lib/student/data';
import { ScheduleSkeleton } from '@/components/student/ScheduleSkeleton';

// Dynamically import interactive client components to optimize load performance and TTI
const ScheduleInteractive = nextDynamic(
  () => import('@/components/student/ScheduleInteractive').then((mod) => mod.ScheduleInteractive),
  {
    loading: () => <ScheduleSkeleton />,
  }
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentSchedulePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    redirect('/signin');
  }

  let scheduleData = {
    events: [],
    stats: {
      upcomingExamsCount: 0,
      pendingAssignmentsCount: 0,
      nextLiveSession: null
    }
  };

  try {
    scheduleData = await getStudentSchedule(token);
  } catch (error) {
    console.error('Failed to load schedule data:', error);
  }

  return (
    <Suspense fallback={<ScheduleSkeleton />}>
      <ScheduleInteractive initialData={scheduleData} />
    </Suspense>
  );
}


