'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import { Building2, Search, Plus, Edit2, Trash2, X, XCircle, RefreshCw } from 'lucide-react';

type Department = {
  id: string;
  name: string;
  classCount: number;
  subjectCount: number;
  createdAt: string;
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

export default function PrincipalDepartmentsPage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();
  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [formName, setFormName] = useState('');

  const filtered = useMemo(
    () => departments.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [departments, searchQuery]
  );

  async function loadData() {
    try {
      setLoading(true);
      const data = await apiJson<Department[]>('/api/principal/departments');
      setDepartments(data);
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
    setModalOpen(true);
  };

  const openEdit = (d: Department) => {
    setEditing(d);
    setFormName(d.name);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editing) {
        const res = await apiJson<any>(`/api/principal/departments/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: formName }),
        });
        setDepartments(prev => prev.map(d => d.id === editing.id ? { ...d, name: res.name } : d));
        showMessage('Department updated', 'success');
      } else {
        const res = await apiJson<Department>('/api/principal/departments', {
          method: 'POST',
          body: JSON.stringify({ name: formName }),
        });
        setDepartments(prev => [...prev, res]);
        showMessage('Department created', 'success');
      }
      setModalOpen(false);
    } catch (e: any) {
      showError(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (d: Department) => {
    if (!confirm(`Delete department "${d.name}"? Classes and subjects will remain but become unassigned.`)) return;
    try {
      await apiJson<any>(`/api/principal/departments/${d.id}`, { method: 'DELETE' });
      setDepartments(prev => prev.filter(x => x.id !== d.id));
      showMessage('Department deleted', 'success');
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
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-8 h-8 text-teal-800" />
                Department Management
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Organize your institution into academic departments to group classes and subjects.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Add Department
            </button>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 border rounded-2xl shadow-3xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search departments..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700/35 transition-all"
              />
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3.5 py-2 border hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading && <div className="text-xs text-slate-400 font-semibold px-2">Loading departments…</div>}
            {!loading && filtered.length === 0 && (
              <div className="text-xs text-slate-400 font-semibold px-2">No departments found</div>
            )}
            {!loading && filtered.map(d => (
              <div key={d.id} className="bg-white border rounded-2xl p-5 shadow-3xs space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-800 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(d)} className="p-1.5 border rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(d)} className="p-1.5 border rounded-lg text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">{d.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400">
                    <span>🏫 {d.classCount} Classes</span>
                    <span>📚 {d.subjectCount} Subjects</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-5 select-none">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-base font-black text-slate-800">{editing ? 'Edit Department' : 'Add Department'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                autoFocus
                placeholder="Department Name (e.g. Science)"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35"
              />
              <div className="flex gap-2 pt-2 border-t">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50">
                  {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
