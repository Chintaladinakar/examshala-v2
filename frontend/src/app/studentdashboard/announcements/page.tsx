import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getStudentAnnouncements } from '@/lib/student/data';
import { AnnouncementsInteractive } from '@/components/student/AnnouncementsInteractive';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  const workspaceId = cookieStore.get('workspace_id')?.value;

  if (!token) {
    redirect('/signin');
  }

  const params = await searchParams;
  const announcements = await getStudentAnnouncements(token, workspaceId, params.search);

  return <AnnouncementsInteractive initialData={announcements} />;
}
