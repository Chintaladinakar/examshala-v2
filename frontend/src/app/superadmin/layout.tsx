import React from 'react';
import { Sidebar } from '@/components/superadmin/Sidebar';
import { Header } from '@/components/superadmin/Header';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPlatformSettings } from '@/lib/superadmin/data';

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    redirect('/signin');
  }

  const settings = await getPlatformSettings(token);

  // Server action to handle logout logic from the layout/page level
  async function handleLogout() {
    'use server';
    const store = await cookies();
    store.delete('session_token');
    redirect('/signin');
  }

  return (
    <div className="flex bg-[#FBFBFB] min-h-screen text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar platformName={settings.platformName} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header logoutAction={handleLogout} />
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
