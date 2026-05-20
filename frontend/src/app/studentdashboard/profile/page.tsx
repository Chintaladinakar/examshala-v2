import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ProfileTabsController from '@/components/student/ProfileTabsController';
import { fetchJson } from '@/lib/api';
import FullPageErrorState from '@/components/ui/FullPageErrorState';
import { logDeveloperError } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type DashboardResponse = { data?: { profile?: unknown } };
type ParentsResponse = { data?: unknown };

export default async function StudentProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) redirect('/signin');

  let profile = null;
  let parents = [];

  let authFailed = false;

  try {
    // We can run these in parallel
    const [dashPayload, parentsPayload] = await Promise.all([
      fetchJson<DashboardResponse>('/api/student/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
        action: 'load',
      }),
      fetchJson<ParentsResponse>('/api/student/parents', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
        action: 'load',
      })
    ]);

    profile = dashPayload.data?.profile;
    parents = Array.isArray(parentsPayload.data) ? (parentsPayload.data as unknown[]) : [];
  } catch (error: unknown) {
    const errRec = (error && typeof error === 'object') ? (error as Record<string, unknown>) : null;
    let status: number | undefined;
    if (typeof errRec?.status === 'number') status = errRec.status;
    const response = errRec?.response;
    if (!status && response && typeof response === 'object') {
      const rs = (response as Record<string, unknown>).status;
      if (typeof rs === 'number') status = rs;
    }
    if (status === 401 || status === 403) authFailed = true;
    logDeveloperError(error, { action: 'load', feature: 'studentprofile' });
    return (
      <div className="max-w-5xl mx-auto">
        <FullPageErrorState error={error} action="load" title="Error" onRetryHref="/studentdashboard/profile" />
      </div>
    );
  }

  if (authFailed) {
    redirect('/signin');
  }

  if (!profile) {
    return <div className="text-center p-8 text-slate-500">Profile data is empty.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Your Profile</h1>
      {/* We pass the initial secured data to a Client Component to handle tab switching and forms */}
      <ProfileTabsController initialProfile={profile} initialParents={parents} />
    </div>
  );
}
