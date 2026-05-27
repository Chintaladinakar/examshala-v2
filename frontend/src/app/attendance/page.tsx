'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';

type ClassLite = { id: string; name: string };
type AttendanceRecord = { id: string; status: 'present' | 'absent'; isLocked: boolean; createdAt: string };
type StudentRow = { id: string; name: string; email: string; isActive: boolean; attendance: AttendanceRecord | null };

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) throw new Error(body?.error?.message || 'Request failed');
  return body.data as T;
}

function yyyyMmDd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();

  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(yyyyMmDd(new Date()));
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const lockedCount = useMemo(() => students.filter(s => s.attendance?.isLocked).length, [students]);

  async function loadClasses() {
    const data = await apiJson<any[]>('/api/classes', { method: 'GET' });
    const mapped = data.map(c => ({ id: c.id, name: c.name }));
    setClasses(mapped);
    if (!classId && mapped[0]) setClassId(mapped[0].id);
  }

  async function loadRoster() {
    if (!classId || !date) return;
    try {
      setLoading(true);
      const data = await apiJson<{ class: ClassLite; date: string; students: StudentRow[] }>(
        `/api/attendance?classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(date)}`,
        { method: 'GET' }
      );
      setStudents(data.students);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClasses().catch(showError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date]);

  async function toggle(student: StudentRow) {
    const next = student.attendance?.status === 'present' ? 'absent' : 'present';
    try {
      if (!student.attendance) {
        await apiJson('/api/attendance', {
          method: 'POST',
          body: JSON.stringify({ classId, date, entries: [{ studentId: student.id, status: next }] }),
        });
        showMessage('Attendance saved', 'success');
        await loadRoster();
      } else {
        const updated = await apiJson<AttendanceRecord>('/api/attendance', {
          method: 'PATCH',
          body: JSON.stringify({ attendanceId: student.attendance.id, status: next }),
        });
        setStudents(prev => prev.map(s => (s.id === student.id ? { ...s, attendance: { ...s.attendance!, ...updated } } : s)));
      }
    } catch (e: any) {
      if (String(e?.message || '').toLowerCase().includes('locked')) showMessage('Locked after 24 hours (principal can override)', 'info');
      showError(e);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
              <p className="text-sm text-slate-600">
                Editable within 24 hours {isPrincipalMode ? '(principal override enabled)' : ''}
              </p>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-4 flex flex-wrap gap-3 items-center">
            <select value={classId} onChange={e => setClassId(e.target.value)} className="px-3 py-2 border rounded-xl bg-white">
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 border rounded-xl bg-white" />
            <button onClick={loadRoster} className="px-3 py-2 border rounded-xl bg-white text-sm font-semibold">
              Refresh
            </button>
            {lockedCount > 0 && <span className="text-xs text-slate-600">Locked records: {lockedCount}</span>}
          </div>

          <div className="bg-white border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Student</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Toggle</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : students.length ? (
                  students.map(s => {
                    const status = s.attendance?.status ?? 'present';
                    const locked = s.attendance?.isLocked ?? false;
                    return (
                      <tr key={s.id} className="border-t">
                        <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                        <td className="px-4 py-3">
                          <span className={status === 'present' ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                            {status === 'present' ? 'Present' : 'Absent'}
                          </span>
                          {locked && <span className="ml-2 text-xs text-slate-500">(locked)</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => toggle(s)}
                            disabled={locked && !isPrincipalMode}
                            className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-50"
                          >
                            Toggle
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      No students in this class
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

