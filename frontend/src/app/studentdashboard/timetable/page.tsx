import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getStudentTimetable } from '@/lib/student/data';
import { TimetableInteractive } from '@/components/student/TimetableInteractive';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentTimetablePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  const workspaceId = cookieStore.get('workspace_id')?.value;

  if (!token) {
    redirect('/signin');
  }

  const slots = await getStudentTimetable(token, workspaceId);

  return <TimetableInteractive slots={slots} />;
}
