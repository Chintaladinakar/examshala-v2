'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';

async function apiJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) throw new Error(body?.error?.message || 'Request failed');
  return body.data as T;
}

export default function PrincipalDashboardPage() {
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const attendancePct = useMemo(() => null as number | null, []);

  async function load() {
    try {
      setLoading(true);
      const [s, t, c, a, l] = await Promise.all([
        apiJson<any[]>('/api/students'),
        apiJson<any[]>('/api/teachers'),
        apiJson<any[]>('/api/classes'),
        apiJson<any[]>('/api/assignments'),
        apiJson<any[]>('/api/logs'),
      ]);
      setStudents(s);
      setTeachers(t);
      setClasses(c);
      setAssignments(a);
      setLogs(l);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex">
      <DashboardSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Principal Dashboard</h1>
            <p className="text-sm text-slate-600">Workspace overview</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card title="Total Students" value={loading ? '—' : String(students.length)} />
            <Card title="Total Teachers" value={loading ? '—' : String(teachers.length)} />
            <Card title="Total Classes" value={loading ? '—' : String(classes.length)} />
            <Card title="Assignments" value={loading ? '—' : String(assignments.length)} />
            <Card title="Attendance %" value={loading ? '—' : attendancePct == null ? 'N/A' : `${attendancePct}%`} />
            <Card title="Recent Logs" value={loading ? '—' : String(logs.length)} />
          </div>

          <div className="bg-white border rounded-2xl p-5">
            <div className="font-bold text-slate-900 mb-3">Recent logs</div>
            {loading ? (
              <div className="text-slate-500">Loading...</div>
            ) : logs.length ? (
              <div className="space-y-2">
                {logs.slice(0, 8).map((l) => (
                  <div key={l.id} className="text-sm text-slate-700 flex items-center justify-between border rounded-xl p-3 bg-slate-50">
                    <div className="font-semibold">{l.actionType}</div>
                    <div className="text-xs text-slate-500">{new Date(l.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500">No logs</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white border rounded-2xl p-5">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}

