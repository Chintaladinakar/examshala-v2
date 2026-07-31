'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import { BookOpen, Search, Plus, Edit2, Trash2, X, XCircle, RefreshCw } from 'lucide-react';

type DepartmentLite = { id: string; name: string };
type TeacherLite = { id: string; name: string };
type Subject = {
  id: string;
  name: string;
  code: string | null;
  department: DepartmentLite | null;
  teachers: TeacherLite[];
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || 'Server operation failed');
  }
  return body.data as T;
}

export default function PrincipalSubjectsPage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();
  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<DepartmentLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState('');

  const filtered = useMemo(() => {
    return subjects.filter(s =>
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.code || '').toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!departmentFilter || s.department?.id === departmentFilter)
    );
  }, [subjects, searchQuery, departmentFilter]);

  async function loadData() {
    try {
      setLoading(true);
      const [subjectsData, departmentsData] = await Promise.all([
        apiJson<Subject[]>('/api/principal/subjects'),
        apiJson<any[]>('/api/principal/departments'),
      ]);
      setSubjects(subjectsData);
      setDepartments(departmentsData.map(d => ({ id: d.id, name: d.name })));
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isPrincipalMode) loadData();
  }, [isPrincipalMode]);

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormCode('');
    setFormDepartmentId('');
    setModalOpen(true);
  };

  const openEdit = (s: Subject) => {
    setEditing(s);
    setFormName(s.name);
    setFormCode(s.code || '');
    setFormDepartmentId(s.department?.id || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editing) {
        const res = await apiJson<Subject>(`/api/principal/subjects/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: formName, code: formCode, departmentId: formDepartmentId || null }),
        });
        setSubjects(prev => prev.map(s => s.id === editing.id ? { ...s, name: res.name, code: res.code, department: res.department } : s));
        showMessage('Subject updated', 'success');
      } else {
        const res = await apiJson<Subject>('/api/principal/subjects', {
          method: 'POST',
          body: JSON.stringify({ name: formName, code: formCode, departmentId: formDepartmentId || undefined }),
        });
        setSubjects(prev => [...prev, res]);
        showMessage('Subject created', 'success');
      }
      setModalOpen(false);
    } catch (e: any) {
      showError(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (s: Subject) => {
    if (!confirm(`Delete subject "${s.name}"? Teacher assignments will be removed.`)) return;
    try {
      await apiJson<any>(`/api/principal/subjects/${s.id}`, { method: 'DELETE' });
      setSubjects(prev => prev.filter(x => x.id !== s.id));
      showMessage('Subject deleted', 'success');
    } catch (e: any) {
      showError(e);
    }
  };

  if (!isPrincipalMode) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 p-8 flex flex-col justify-center items-center">
          <div className="bg-white border p-12 rounded-3xl shadow-xl max-w-md text-center space-y-4">
            <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-black text-slate-800">Access Denied</h2>
            <p className="text-slate-500 text-sm leading-relaxed">This dashboard is exclusive to Principals.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto select-none">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-teal-800" />
                Subject Management
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Define the curriculum registry used across teacher assignments, classes, and materials.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 border rounded-2xl shadow-3xs">
            <div className="flex flex-wrap gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700/35 transition-all"
                />
              </div>
              <select
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35"
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3.5 py-2 border hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="bg-white border rounded-2xl shadow-3xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Teachers Assigned</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading && (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-xs text-slate-400 font-semibold">Loading subjects…</td></tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-xs text-slate-400 font-semibold">No subjects found</td></tr>
                  )}
                  {!loading && filtered.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-xs font-black text-slate-800">{s.name}</div>
                        {s.code && <div className="text-[10px] text-slate-400 font-bold">{s.code}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {s.department ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-100">
                            {s.department.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {s.teachers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {s.teachers.slice(0, 3).map(t => (
                              <span key={t.id} className="px-2 py-0.5 bg-violet-50/70 border border-violet-100/60 rounded-lg text-[10px] font-bold text-violet-900">
                                {t.name}
                              </span>
                            ))}
                            {s.teachers.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-bold">+{s.teachers.length - 3} more</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">None assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEdit(s)} className="p-1.5 border rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(s)} className="p-1.5 border rounded-lg text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-5 select-none">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-base font-black text-slate-800">{editing ? 'Edit Subject' : 'Add Subject'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                autoFocus
                placeholder="Subject Name (e.g. Chemistry)"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35"
              />
              <input
                placeholder="Subject Code (optional, e.g. CHEM101)"
                value={formCode}
                onChange={e => setFormCode(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35"
              />
              <select
                value={formDepartmentId}
                onChange={e => setFormDepartmentId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35"
              >
                <option value="">No Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <div className="flex gap-2 pt-2 border-t">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50">
                  {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
