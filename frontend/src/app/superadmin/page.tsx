import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { StatCard } from '@/components/superadmin/StatCard';
import { Users, Building2, Activity, ClipboardCheck } from 'lucide-react';
import { RecentUsers } from '@/components/superadmin/RecentUsers';
import { RecentWorkspaces } from '@/components/superadmin/RecentWorkspaces';
import { fetchJson } from '@/lib/api';
import FullPageErrorState from '@/components/ui/FullPageErrorState';
import { logDeveloperError } from '@/lib/error-handler';

type SuperAdminDashboardResponse = { data?: unknown };
type RecentUser = { id: string; name: string; email: string; role: string; createdAt: string };
type RecentWorkspaceItem = { id: string; name: string; userCount: number; createdAt: string };

async function getDashboardData(token: string) {
  const payload = await fetchJson<SuperAdminDashboardResponse>('/api/superadmin/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store',
    action: 'load',
  });
  return payload.data;
}

export default async function SuperAdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    redirect('/signin');
  }

  let data;
  try {
    data = await getDashboardData(token);
  } catch (error: unknown) {
    const errRec = (error && typeof error === 'object') ? (error as Record<string, unknown>) : null;
    let status: number | undefined;
    if (typeof errRec?.status === 'number') status = errRec.status;
    const response = errRec?.response;
    if (!status && response && typeof response === 'object') {
      const rs = (response as Record<string, unknown>).status;
      if (typeof rs === 'number') status = rs;
    }
    if (status === 401 || status === 403) redirect('/signin');
    logDeveloperError(error, { action: 'load', feature: 'superadmin_dashboard' });
    return (
      <FullPageErrorState error={error} action="load" title="API Error" onRetryHref="/superadmin" />
    );
  }

  const d = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
  const totalUsers = d.totalUsers as number;
  const totalWorkspaces = d.totalWorkspaces as number;
  const totalResults = d.totalResults as number;
  const activeSessions = d.activeSessions as number;
  const recentUsers = (Array.isArray(d.recentUsers) ? (d.recentUsers as unknown[]) : []) as RecentUser[];
  const recentWorkspaces = (Array.isArray(d.recentWorkspaces) ? (d.recentWorkspaces as unknown[]) : []) as RecentWorkspaceItem[];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Overview</h1>
        <p className="text-slate-500">Consolidated analytics and recent activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
          label="Total Users" 
          value={totalUsers} 
          icon={Users} 
          color="indigo"
          trend={{ value: '12%', isPositive: true }}
        />
        <StatCard 
          label="Total Workspaces" 
          value={totalWorkspaces} 
          icon={Building2} 
          color="emerald"
        />
        <StatCard 
          label="Active Sessions" 
          value={activeSessions} 
          icon={Activity} 
          color="amber"
          trend={{ value: '5%', isPositive: true }}
        />
        <StatCard 
          label="Total Results" 
          value={totalResults || 0} 
          icon={ClipboardCheck} 
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentUsers users={recentUsers} />
        <RecentWorkspaces workspaces={recentWorkspaces} />
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-200">
         <div className="relative z-10 max-w-lg">
           <h2 className="text-2xl font-black mb-2">Advanced Analytics</h2>
           <p className="text-indigo-100 mb-6">Real-time monitoring and predictive growth metrics are now active.</p>
           <button className="bg-white text-indigo-700 px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-50 transition-colors">
              View Detailed Reports
           </button>
         </div>
         <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
