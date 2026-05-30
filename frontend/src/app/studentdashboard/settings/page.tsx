import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SettingsController from '@/components/student/SettingsController';
import { getStudentProfile, getStudentSettings } from '@/lib/student/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentSettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  const workspaceId = cookieStore.get('workspace_id')?.value;

  if (!token) redirect('/signin');

  let profile = null;
  let settings = null;

  try {
    const [prof, setts] = await Promise.all([
      getStudentProfile(token, workspaceId),
      getStudentSettings(token, workspaceId)
    ]);
    profile = prof;
    settings = setts;
  } catch (error) {
    console.error('Failed to load settings data:', error);
  }

  if (!profile || !settings) {
    return <div className="text-center p-8 text-slate-500">Failed to load configuration.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
      <SettingsController initialProfile={profile} initialSettings={settings} />
    </div>
  );
}
