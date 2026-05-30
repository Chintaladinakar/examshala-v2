import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ProfileTabsController from '@/components/student/ProfileTabsController';
import FullPageErrorState from '@/components/ui/FullPageErrorState';
import { logDeveloperError } from '@/lib/error-handler';
import { getStudentProfile, getStudentParents } from '@/lib/student/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  const workspaceId = cookieStore.get('workspace_id')?.value;

  if (!token) redirect('/signin');

  let profile: unknown = null;
  let parents: unknown[] = [];

  let authFailed = false;

  try {
    const [prof, parentLinks] = await Promise.all([
      getStudentProfile(token, workspaceId),
      getStudentParents(token),
    ]);
    profile = prof ?? null;
    parents = Array.isArray(parentLinks) ? parentLinks : [];
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
