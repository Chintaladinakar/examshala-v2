'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';

type ClassLite = { id: string; name: string };
type StudentRow = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  status: string;
  class: ClassLite | null;
};

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) throw new Error(body?.error?.message || 'Request failed');
  return body.data as T;
}

export default function StudentsPage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();

  const canManage = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';
  const canAdd = (user?.role || '').toLowerCase() === 'principal' || (user?.role || '').toLowerCase() === 'teacher' || (user?.mode || '') === 'teacher';

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchText = `${s.name} ${s.email}`.toLowerCase().includes(search.toLowerCase());
      const matchClass = !classFilter || s.class?.id === classFilter;
      return matchText && matchClass;
    });
  }, [students, search, classFilter]);

  async function load() {
    try {
      setLoading(true);
      const [studentData, classData] = await Promise.all([
        apiJson<StudentRow[]>('/api/students', { method: 'GET' }),
        apiJson<any[]>('/api/classes', { method: 'GET' }),
      ]);
      setStudents(studentData);
      setClasses(classData.map(c => ({ id: c.id, name: c.name })));
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

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!canAdd) return;
    try {
      setSubmitting(true);
      const created = await apiJson<StudentRow>('/api/students', {
        method: 'POST',
        body: JSON.stringify({ name: formName, email: formEmail, password: formPassword || undefined, classId: formClassId || undefined }),
      });
      showMessage('Student added', 'success');
      setStudents(prev => [created, ...prev]);
      setAddOpen(false);
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormClassId('');
    } catch (e2) {
      showError(e2);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(student: StudentRow) {
    if (!canManage) return showMessage('Only principal mode can manage students', 'info');
    try {
      const updated = await apiJson<{ id: string; isActive: boolean }>('/api/students/status', {
        method: 'PATCH',
        body: JSON.stringify({ studentId: student.id, isActive: !student.isActive }),
      });
      setStudents(prev => prev.map(s => (s.id === student.id ? { ...s, isActive: updated.isActive } : s)));
      showMessage('Status updated', 'success');
    } catch (e) {
      showError(e);
    }
  }

  async function assignClass(studentId: string, nextClassId: string) {
    if (!canManage) return;
    try {
      await apiJson('/api/students/class', { method: 'PATCH', body: JSON.stringify({ studentId, classId: nextClassId || null }) });
      const klass = classes.find(c => c.id === nextClassId) ?? null;
      setStudents(prev => prev.map(s => (s.id === studentId ? { ...s, class: klass } : s)));
      showMessage('Class updated', 'success');
    } catch (e) {
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
              <h1 className="text-2xl font-bold text-slate-900">Students</h1>
              <p className="text-sm text-slate-600">Workspace-scoped student management</p>
            </div>
            {canAdd && (
              <button onClick={() => setAddOpen(true)} className="px-4 py-2 rounded-xl bg-teal-950 text-white font-semibold text-sm hover:bg-teal-900">
                Add Student
              </button>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name/email" className="px-3 py-2 border rounded-xl bg-white w-72" />
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="px-3 py-2 border rounded-xl bg-white">
              <option value="">All classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button onClick={load} className="px-3 py-2 border rounded-xl bg-white text-sm font-semibold">
              Refresh
            </button>
          </div>

          <div className="bg-white border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold">Class</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map(s => (
                    <tr key={s.id} className="border-t">
                      <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                      <td className="px-4 py-3 text-slate-700">{s.email}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {canManage ? (
                          <select value={s.class?.id || ''} onChange={e => assignClass(s.id, e.target.value)} className="px-2 py-1 border rounded-lg bg-white">
                            <option value="">Unassigned</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{s.class?.name || '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={s.isActive ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => toggleActive(s)}
                          disabled={!canManage}
                          className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-50"
                        >
                          {s.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {addOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded-2xl border shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Add student</h2>
                <button onClick={() => setAddOpen(false)} className="text-slate-500 hover:text-slate-800">
                  ✕
                </button>
              </div>
              <form onSubmit={onAdd} className="space-y-3">
                <input required value={formName} onChange={e => setFormName(e.target.value)} placeholder="Full name" className="w-full px-3 py-2 border rounded-xl" />
                <input required type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border rounded-xl" />
                <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Password (optional)" className="w-full px-3 py-2 border rounded-xl" />
                <select value={formClassId} onChange={e => setFormClassId(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-white">
                  <option value="">Assign class (optional)</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setAddOpen(false)} className="flex-1 px-3 py-2 rounded-xl border font-semibold">
                    Cancel
                  </button>
                  <button disabled={submitting} className="flex-1 px-3 py-2 rounded-xl bg-teal-950 text-white font-semibold disabled:opacity-50">
                    {submitting ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

