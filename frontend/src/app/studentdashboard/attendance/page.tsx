import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getStudentAttendance } from '@/lib/student/data';
import { AttendanceInteractive } from '@/components/student/AttendanceInteractive';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentAttendancePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  const workspaceId = cookieStore.get('workspace_id')?.value;

  if (!token) {
    redirect('/signin');
  }

  const attendanceData = await getStudentAttendance(token, workspaceId);

  return <AttendanceInteractive initialData={attendanceData} />;
}
