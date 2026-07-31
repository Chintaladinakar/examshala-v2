import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getStudentCalendarEvents } from '@/lib/student/data';
import { CalendarInteractive } from '@/components/student/CalendarInteractive';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  const workspaceId = cookieStore.get('workspace_id')?.value;

  if (!token) {
    redirect('/signin');
  }

  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
  const month = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;

  const events = await getStudentCalendarEvents(token, workspaceId, { year, month });

  return <CalendarInteractive initialEvents={events} year={year} month={month} />;
}
