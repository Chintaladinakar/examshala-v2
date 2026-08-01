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

  const roleLower = (user?.role || '').toLowerCase();
  const canManage = roleLower === 'principal';
  const canAdd = roleLower === 'principal' || roleLower === 'teacher' || roleLower === 'tutor';

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<'create' | 'associate'>('create');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUniqueId, setFormUniqueId] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [inviteEmailSent, setInviteEmailSent] = useState(false);
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
      
      const payload = addMode === 'associate'
        ? { mode: 'associate', uniqueId: formUniqueId, classId: formClassId || undefined }
        : { mode: 'create', name: formName, email: formEmail, classId: formClassId || undefined };

      const res = await apiJson<any>('/api/students', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      showMessage(addMode === 'associate' ? 'Student associated' : 'Student created', 'success');
      load();

      if (addMode === 'create' && res.generatedPassword) {
        setCreatedPassword(res.generatedPassword);
      } else if (addMode === 'create' && res.credentialDelivery === 'email') {
        setInviteEmailSent(true);
      } else {
        setAddOpen(false);
        setFormName('');
        setFormEmail('');
        setFormClassId('');
        setFormUniqueId('');
      }
    } catch (e2) {
      showError(e2);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(student: StudentRow) {
    if (!canManage) return showMessage('Only principals can manage students', 'info');
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
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 p-6">
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

          <div className="bg-white border rounded-2xl overflow-x-auto">
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
            {inviteEmailSent ? (
              <div className="bg-white w-full max-w-md rounded-2xl border shadow-xl p-6 space-y-4 text-center animate-fade-in">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl">
                  📧
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-black text-slate-800">Student Account Created!</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Invitation email sent</p>
                </div>
                <p className="text-xs text-slate-600 font-semibold">
                  A sign-in link and temporary password were emailed to <span className="font-bold text-slate-800">{formEmail}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInviteEmailSent(false);
                    setAddOpen(false);
                    setFormName('');
                    setFormEmail('');
                    setFormClassId('');
                    setFormUniqueId('');
                  }}
                  className="w-full px-4 py-2 bg-teal-950 hover:bg-teal-900 text-white rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            ) : createdPassword ? (
              <div className="bg-white w-full max-w-md rounded-2xl border shadow-xl p-6 space-y-4 text-center animate-fade-in">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl">
                  🎉
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-black text-slate-800">Student Account Created!</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Save login credentials</p>
                </div>
                <div className="bg-slate-50 border p-4 rounded-xl space-y-2 text-left text-xs font-semibold">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-extrabold uppercase tracking-wide">Email Address</span>
                    <span className="text-slate-700">{formEmail}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-extrabold uppercase tracking-wide">Temporary Password</span>
                    <span className="text-slate-800 font-mono text-sm tracking-wider font-extrabold">{createdPassword}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`Email: ${formEmail}\nPassword: ${createdPassword}`);
                      showMessage('Credentials copied to clipboard!', 'success');
                    }}
                    className="flex-1 px-4 py-2 border rounded-xl hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
                  >
                    📋 Copy Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedPassword(null);
                      setAddOpen(false);
                      setFormName('');
                      setFormEmail('');
                      setFormClassId('');
                      setFormUniqueId('');
                    }}
                    className="flex-1 px-4 py-2 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white w-full max-w-md rounded-2xl border shadow-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h2 className="text-lg font-bold text-slate-900">Add Student to Workspace</h2>
                  <button onClick={() => { setAddOpen(false); setFormUniqueId(''); setFormEmail(''); setFormName(''); }} className="text-slate-500 hover:text-slate-800">
                    ✕
                  </button>
                </div>
                
                {/* Tab Switcher */}
                <div className="flex rounded-xl bg-slate-100 p-0.5 border text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAddMode('create')}
                    className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-all ${addMode === 'create' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
                  >
                    Create New Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode('associate')}
                    className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-all ${addMode === 'associate' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
                  >
                    Associate Existing
                  </button>
                </div>

                <form onSubmit={onAdd} className="space-y-4">
                  {addMode === 'create' ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Full Name *</label>
                        <input required value={formName} onChange={e => setFormName(e.target.value)} placeholder="Full name" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Email Address *</label>
                        <input required type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Unique Identifier (Email, Username, or ID) *</label>
                      <input required value={formUniqueId} onChange={e => setFormUniqueId(e.target.value)} placeholder="Enter unique ID or email" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Class Section (Optional)</label>
                    <select value={formClassId} onChange={e => setFormClassId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none">
                      <option value="">Assign class (optional)</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <button type="button" onClick={() => { setAddOpen(false); setFormUniqueId(''); setFormEmail(''); setFormName(''); }} className="flex-1 px-3 py-2 rounded-xl border text-xs font-bold hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button disabled={submitting} className="flex-1 px-3 py-2 rounded-xl bg-teal-950 text-white text-xs font-bold hover:bg-teal-900 transition-colors disabled:opacity-50">
                      {submitting ? 'Processing...' : addMode === 'associate' ? 'Associate Student' : 'Create Student'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

