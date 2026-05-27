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

export default function TeacherDashboardPage() {
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  const studentCount = useMemo(() => {
    const set = new Set<string>();
    for (const c of classes) {
      for (const s of c.students || []) set.add(s.Student?.id);
    }
    return set.size;
  }, [classes]);

  async function load() {
    try {
      setLoading(true);
      const [c, a] = await Promise.all([apiJson<any[]>('/api/classes'), apiJson<any[]>('/api/assignments')]);
      setClasses(c);
      setAssignments(a);
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
            <h1 className="text-2xl font-bold text-slate-900">Teacher Dashboard</h1>
            <p className="text-sm text-slate-600">Your assigned classes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card title="Assigned Classes" value={loading ? '—' : String(classes.length)} />
            <Card title="Students" value={loading ? '—' : String(studentCount)} />
            <Card title="Assignments" value={loading ? '—' : String(assignments.length)} />
          </div>

          <div className="bg-white border rounded-2xl p-5">
            <div className="font-bold text-slate-900 mb-3">Classes</div>
            {loading ? (
              <div className="text-slate-500">Loading...</div>
            ) : classes.length ? (
              <div className="grid md:grid-cols-2 gap-3">
                {classes.map((c) => (
                  <div key={c.id} className="border rounded-2xl p-4 bg-slate-50">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-sm text-slate-600 mt-1">Students: {(c.students || []).length}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500">No assigned classes</div>
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

