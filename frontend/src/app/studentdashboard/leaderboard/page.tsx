import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getStudentLeaderboard } from '@/lib/student/data';
import { LeaderboardInteractive } from '@/components/student/LeaderboardInteractive';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentLeaderboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  const workspaceId = cookieStore.get('workspace_id')?.value;

  if (!token) {
    redirect('/signin');
  }

  const data = await getStudentLeaderboard(token, workspaceId);

  return <LeaderboardInteractive data={data} />;
}
