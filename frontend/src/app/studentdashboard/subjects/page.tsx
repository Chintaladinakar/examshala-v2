import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getStudentSubjects } from '@/lib/student/data';
import { SubjectsInteractive } from '@/components/student/SubjectsInteractive';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentSubjectsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  const workspaceId = cookieStore.get('workspace_id')?.value;

  if (!token) {
    redirect('/signin');
  }

  const subjects = await getStudentSubjects(token, workspaceId);

  return <SubjectsInteractive subjects={subjects} />;
}
