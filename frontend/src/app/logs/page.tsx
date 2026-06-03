'use client';

import React, { useEffect, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';

type LogRow = {
  id: string;
  actionType: string;
  entityId: string;
  timestamp: string;
  role: string;
  User?: { name: string; email: string };
};

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) throw new Error(body?.error?.message || 'Request failed');
  return body.data as T;
}

export default function LogsPage() {
  const { user } = useUser();
  const { showError } = useToast();

  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const data = await apiJson<LogRow[]>('/api/logs', { method: 'GET' });
      setLogs(data);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isPrincipalMode) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrincipalMode]);

  if (!isPrincipalMode) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto bg-white border rounded-2xl p-6">
            <h1 className="text-xl font-bold text-slate-900">Logs</h1>
            <p className="text-slate-600 mt-2">Only principals can access this page.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Logs</h1>
              <p className="text-sm text-slate-600">Attendance, assignments, and feedback events (workspace-scoped)</p>
            </div>
            <button onClick={load} className="px-3 py-2 border rounded-xl bg-white text-sm font-semibold">
              Refresh
            </button>
          </div>

          <div className="bg-white border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Time</th>
                  <th className="text-left px-4 py-3 font-semibold">Action</th>
                  <th className="text-left px-4 py-3 font-semibold">Actor</th>
                  <th className="text-left px-4 py-3 font-semibold">Entity</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : logs.length ? (
                  logs.map(l => (
                    <tr key={l.id} className="border-t">
                      <td className="px-4 py-3 text-slate-700">{new Date(l.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{l.actionType}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {l.User?.name || '—'} <span className="text-xs text-slate-500">({l.role})</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-mono text-xs">{l.entityId}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No logs
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

