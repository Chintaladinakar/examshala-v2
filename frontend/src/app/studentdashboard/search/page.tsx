import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getStudentGlobalSearch } from '@/lib/student/data';
import { SearchResultsInteractive } from '@/components/student/SearchResultsInteractive';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  const workspaceId = cookieStore.get('workspace_id')?.value;

  if (!token) {
    redirect('/signin');
  }

  const params = await searchParams;
  const query = params.q || '';
  const results = await getStudentGlobalSearch(token, workspaceId, query);

  return <SearchResultsInteractive query={query} results={results} />;
}
