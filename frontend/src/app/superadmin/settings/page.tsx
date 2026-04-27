import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Globe } from 'lucide-react';
import { SettingsForm } from '@/components/superadmin/SettingsForm';

async function getSettings(token: string) {
  const res = await fetch('http://localhost:5000/api/superadmin/settings', {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch settings');
  const payload = await res.json();
  return payload.data;
}

export default async function SuperAdminSettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    redirect('/signin');
  }

  let initialSettings;
  try {
    initialSettings = await getSettings(token);
  } catch (error) {
    initialSettings = { platformName: 'Examshala', supportEmail: 'support@examshala.com' };
  }

  async function updateSettings(settings: any) {
    'use server';
    const store = await cookies();
    const serverToken = store.get('session_token')?.value;
    
    await fetch('http://localhost:5000/api/superadmin/settings', {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${serverToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Settings</h1>
        <p className="text-slate-500">Configure global parameters and platform branding.</p>
      </div>

      <div className="max-w-3xl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">General Configuration</h2>
              <p className="text-sm text-slate-500">Global branding and support information.</p>
            </div>
          </div>

          <SettingsForm initialSettings={initialSettings} onSave={updateSettings} />
        </div>

        <div className="mt-8 bg-rose-50/50 border border-rose-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-rose-900 font-bold">Dangerous Zone</h3>
            <p className="text-sm text-rose-600/80 font-medium">Clear system logs and reset platform metrics. Use with caution.</p>
          </div>
          <button className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-100 active:scale-95">
            Reset All Metrics
          </button>
        </div>
      </div>
    </div>
  );
}
