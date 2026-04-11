import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ProfileTabsController from '@/components/student/ProfileTabsController';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) redirect('/signin');

  let profile = null;
  let parents = [];

  let authFailed = false;

  try {
    // We can run these in parallel
    const [dashRes, parentsRes] = await Promise.all([
      fetch('http://localhost:5000/api/student/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      }),
      fetch('http://localhost:5000/api/student/parents', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      })
    ]);

    if (!dashRes.ok || !parentsRes.ok) {
      if (dashRes.status === 401 || parentsRes.status === 401) {
        authFailed = true;
      } else {
        throw new Error('Failed to load profile data');
      }
    } else {
      const [dashPayload, parentsPayload] = await Promise.all([
        dashRes.json(),
        parentsRes.json()
      ]);

      profile = dashPayload.data?.profile;
      parents = parentsPayload.data || [];
    }
  } catch (error: any) {
    console.error('API Error:', error.message);
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-700 mb-2">Error</h2>
        <p className="text-slate-500">Failed to load profile securely: {error.message}</p>
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
