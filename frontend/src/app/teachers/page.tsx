'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';

type ClassLite = { id: string; name: string };
type TeacherRow = { id: string; name: string; email: string; isActive: boolean; status: string; classes: ClassLite[] };

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) throw new Error(body?.error?.message || 'Request failed');
  return body.data as T;
}

export default function TeachersPage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();

  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formClassIds, setFormClassIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    return teachers.filter(t => `${t.name} ${t.email}`.toLowerCase().includes(search.toLowerCase()));
  }, [teachers, search]);

  async function load() {
    try {
      setLoading(true);
      const [teacherData, classData] = await Promise.all([
        apiJson<TeacherRow[]>('/api/teachers', { method: 'GET' }),
        apiJson<any[]>('/api/classes', { method: 'GET' }),
      ]);
      setTeachers(teacherData);
      setClasses(classData.map(c => ({ id: c.id, name: c.name })));
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

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      const created = await apiJson<TeacherRow>('/api/teachers', {
        method: 'POST',
        body: JSON.stringify({ name: formName, email: formEmail, password: formPassword || undefined, classIds: formClassIds }),
      });
      showMessage('Teacher added', 'success');
      setTeachers(prev => [created, ...prev]);
      setAddOpen(false);
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormClassIds([]);
      await load();
    } catch (e2) {
      showError(e2);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(t: TeacherRow) {
    try {
      const updated = await apiJson<{ id: string; isActive: boolean }>('/api/teachers/status', {
        method: 'PATCH',
        body: JSON.stringify({ teacherId: t.id, isActive: !t.isActive }),
      });
      setTeachers(prev => prev.map(x => (x.id === t.id ? { ...x, isActive: updated.isActive } : x)));
      showMessage('Status updated', 'success');
    } catch (e) {
      showError(e);
    }
  }

  async function saveClasses(t: TeacherRow, classIds: string[]) {
    try {
      await apiJson('/api/teachers/classes', { method: 'PATCH', body: JSON.stringify({ teacherId: t.id, classIds }) });
      showMessage('Classes updated', 'success');
      await load();
    } catch (e) {
      showError(e);
    }
  }

  if (!isPrincipalMode) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto bg-white border rounded-2xl p-6">
            <h1 className="text-xl font-bold text-slate-900">Teachers</h1>
            <p className="text-slate-600 mt-2">Only principals (principal mode) can access this page.</p>
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
              <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
              <p className="text-sm text-slate-600">Principal-only management</p>
            </div>
            <button onClick={() => setAddOpen(true)} className="px-4 py-2 rounded-xl bg-teal-950 text-white font-semibold text-sm hover:bg-teal-900">
              Add Teacher
            </button>
          </div>

          <div className="flex gap-3 flex-wrap">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name/email" className="px-3 py-2 border rounded-xl bg-white w-72" />
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
                  <th className="text-left px-4 py-3 font-semibold">Classes</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map(t => (
                    <tr key={t.id} className="border-t align-top">
                      <td className="px-4 py-3 font-medium text-slate-900">{t.name}</td>
                      <td className="px-4 py-3 text-slate-700">{t.email}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <TeacherClassesEditor teacher={t} classes={classes} onSave={saveClasses} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => toggleActive(t)} className="px-3 py-1.5 rounded-lg border text-xs font-semibold">
                          {t.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No teachers found
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
                <h2 className="text-lg font-bold text-slate-900">Add teacher</h2>
                <button onClick={() => setAddOpen(false)} className="text-slate-500 hover:text-slate-800">
                  ✕
                </button>
              </div>
              <form onSubmit={onAdd} className="space-y-3">
                <input required value={formName} onChange={e => setFormName(e.target.value)} placeholder="Full name" className="w-full px-3 py-2 border rounded-xl" />
                <input required type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border rounded-xl" />
                <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Password (optional)" className="w-full px-3 py-2 border rounded-xl" />
                <div className="border rounded-xl p-3">
                  <div className="text-xs font-bold text-slate-600 mb-2">Assign classes</div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
                    {classes.map(c => (
                      <label key={c.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={formClassIds.includes(c.id)}
                          onChange={e =>
                            setFormClassIds(prev => (e.target.checked ? [...prev, c.id] : prev.filter(x => x !== c.id)))
                          }
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                </div>
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

function TeacherClassesEditor({
  teacher,
  classes,
  onSave,
}: {
  teacher: TeacherRow;
  classes: ClassLite[];
  onSave: (teacher: TeacherRow, classIds: string[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(teacher.classes.map(c => c.id));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(teacher.classes.map(c => c.id));
  }, [teacher.id, teacher.classes]);

  async function save() {
    try {
      setSaving(true);
      await onSave(teacher, selected);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {(teacher.classes || []).length ? (
          teacher.classes.map(c => (
            <span key={c.id} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
              {c.name}
            </span>
          ))
        ) : (
          <span className="text-slate-500">—</span>
        )}
      </div>
      <button onClick={() => setOpen(v => !v)} className="text-xs font-semibold underline text-slate-700">
        {open ? 'Close' : 'Edit classes'}
      </button>
      {open && (
        <div className="border rounded-xl p-3 bg-slate-50">
          <div className="grid grid-cols-2 gap-2 max-h-44 overflow-auto">
            {classes.map(c => (
              <label key={c.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={e => setSelected(prev => (e.target.checked ? [...prev, c.id] : prev.filter(x => x !== c.id)))}
                />
                {c.name}
              </label>
            ))}
          </div>
          <div className="flex gap-2 pt-3">
            <button onClick={() => setOpen(false)} className="flex-1 px-3 py-2 rounded-xl border font-semibold text-sm">
              Cancel
            </button>
            <button disabled={saving} onClick={save} className="flex-1 px-3 py-2 rounded-xl bg-teal-950 text-white font-semibold text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

