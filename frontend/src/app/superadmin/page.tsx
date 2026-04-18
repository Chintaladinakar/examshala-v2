import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Users, Building2, Activity } from 'lucide-react';
import { RecentUsers } from '@/components/superadmin/RecentUsers';
import { RecentWorkspaces } from '@/components/superadmin/RecentWorkspaces';

async function getDashboardData(token: string) {
  const res = await fetch('http://localhost:5000/api/superadmin/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store'
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      redirect('/signin');
    }
    throw new Error('Failed to fetch dashboard data');
  }

  const payload = await res.json();
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
  } catch (error) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-100 rounded-2xl text-rose-800">
        <h2 className="text-xl font-bold">API Error</h2>
        <p>Could not load platform overview. Please ensure the backend is healthy.</p>
      </div>
    );
  }

  const { totalUsers, totalWorkspaces, activeSessions, recentUsers, recentWorkspaces } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Overview</h1>
        <p className="text-slate-500">Consolidated analytics and recent activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1 group-hover:text-indigo-600 transition-colors">Total Users</p>
            <h3 className="text-3xl font-black text-slate-900">{totalUsers.toLocaleString()}</h3>
          </div>
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:rotate-6 transition-all duration-300">
            <Users className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1 group-hover:text-indigo-600 transition-colors">Total Workspaces</p>
            <h3 className="text-3xl font-black text-slate-900">{totalWorkspaces.toLocaleString()}</h3>
          </div>
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:-rotate-6 transition-all duration-300">
            <Building2 className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1 group-hover:text-indigo-600 transition-colors">Active Sessions</p>
            <h3 className="text-3xl font-black text-slate-900">{activeSessions.toLocaleString()}</h3>
          </div>
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:bg-amber-600 group-hover:scale-110 transition-all duration-300">
            <Activity className="w-7 h-7 text-amber-600 group-hover:text-white transition-colors" />
          </div>
        </div>
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
