'use client';

import React, { useState, useEffect } from 'react';
import { fetchJson } from '@/lib/api';

interface User {
  id: string;
  role: string;
  status: string;
}

interface Workspace {
  id: string;
}

interface Log {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  entity: string;
  createdAt: string;
  metadata?: any;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalWorkspaces: 0,
    totalTeachers: 0,
  });

  const [recentLogs, setRecentLogs] = useState<Log[]>([]);

  // Cookie helper
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = getCookie('session_token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch concurrently
        const [usersRes, workspacesRes, logsRes] = await Promise.all([
          fetchJson<{ success: boolean; data: User[] }>('/api/admin/users', { headers }),
          fetchJson<{ success: boolean; data: Workspace[] }>('/api/admin/workspaces', { headers }),
          fetchJson<{ success: boolean; data: Log[] }>('/api/admin/logs', { headers }),
        ]);

        const users = usersRes.data || [];
        const workspaces = workspacesRes.data || [];
        const logs = logsRes.data || [];

        // Compute metrics
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
        const totalWorkspaces = workspaces.length;
        const totalTeachers = users.filter(u => u.role === 'TEACHER').length;

        setStats({
          totalUsers,
          activeUsers,
          totalWorkspaces,
          totalTeachers,
        });

        setRecentLogs(logs.slice(0, 8)); // take first 8 logs

      } catch (err: any) {
        console.error('Failed to load dashboard data:', err);
        setError(err.message || 'Failed to sync with administration database.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div>
          <div className="h-8 bg-slate-200 rounded-lg w-48 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded-lg w-80"></div>
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 h-32 flex flex-col justify-between">
              <div className="h-4 bg-slate-200 rounded-lg w-20"></div>
              <div className="h-8 bg-slate-200 rounded-lg w-12"></div>
            </div>
          ))}
        </div>

        {/* Skeleton Logs */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 h-96">
          <div className="h-6 bg-slate-200 rounded-lg w-32 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded-lg w-1/3"></div>
                  <div className="h-3 bg-slate-200 rounded-lg w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center max-w-xl mx-auto my-12">
        <span className="text-4xl block mb-4">⚠️</span>
        <h2 className="text-xl font-bold text-rose-900 mb-2">Sync Connection Failure</h2>
        <p className="text-rose-700 text-sm mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Platform Users',
      value: stats.totalUsers,
      color: 'text-teal-700',
      bgColor: 'bg-teal-50',
      icon: (
        <svg className="w-6 h-6 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      icon: (
        <svg className="w-6 h-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Active Workspaces',
      value: stats.totalWorkspaces,
      color: 'text-teal-700',
      bgColor: 'bg-teal-50',
      icon: (
        <svg className="w-6 h-6 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      title: 'Total Teachers',
      value: stats.totalTeachers,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      icon: (
        <svg className="w-6 h-6 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header text */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Overview Dashboard</h2>
        <p className="text-slate-500 mt-1">Platform monitor, key statistics, and system event tracking logs.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-shadow flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">{card.title}</span>
              <span className={`text-3xl font-extrabold text-slate-900`}>{card.value}</span>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${card.bgColor} flex items-center justify-center`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Logs */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Platform Operations</h3>
            <p className="text-xs text-slate-500 mt-0.5">Most recent administrative activities across tenants.</p>
          </div>
          <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">
            Live Stream
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {recentLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              <span className="text-2xl block mb-2">📋</span>
              No administrative operations found in database.
            </div>
          ) : (
            recentLogs.map((log) => {
              const formattedDate = new Date(log.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              // Nice badges for entity type
              let entityBadgeColor = 'bg-slate-100 text-slate-700';
              if (log.entity === 'USER') entityBadgeColor = 'bg-teal-50 text-teal-800 border border-teal-100';
              if (log.entity === 'WORKSPACE') entityBadgeColor = 'bg-teal-50 text-teal-850 border border-teal-100';
              if (log.entity === 'INVITE') entityBadgeColor = 'bg-amber-50 text-amber-800 border border-amber-100';

              return (
                <div key={log.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    {/* Event Avatar Icon */}
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-lg">
                        {log.action === 'USER_CREATED' && '👤'}
                        {log.action === 'WORKSPACE_CREATED' && '🏢'}
                        {log.action === 'INVITE_SENT' && '✉️'}
                        {log.action === 'ROLE_ASSIGNED' && '🔑'}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-sm font-bold text-slate-800">{log.action}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${entityBadgeColor}`}>
                          {log.entity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Triggered by <span className="font-medium text-slate-800">{log.userName || log.userEmail}</span> ({log.userEmail || 'System'})
                      </p>
                      
                      {/* Meta snippet */}
                      {log.metadata && typeof log.metadata === 'object' && Object.keys(log.metadata).length > 0 && (
                        <div className="text-[10px] text-slate-400 font-mono bg-slate-50 border border-slate-100 px-2 py-1 rounded-md mt-1.5 inline-block">
                          {JSON.stringify(log.metadata)}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 font-medium sm:text-right shrink-0">
                    {formattedDate}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
