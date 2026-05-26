'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';

type UserLite = { id: string; name: string; email: string; isActive: boolean };
type ClassRow = {
  id: string;
  name: string;
  createdAt: string;
  students: { Student: UserLite }[];
  teachers: { Teacher: UserLite }[];
};

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) throw new Error(body?.error?.message || 'Request failed');
  return body.data as T;
}

export default function ClassesPage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();

  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<UserLite[]>([]);
  const [teachers, setTeachers] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const filtered = useMemo(() => classes.filter(c => c.name.toLowerCase().includes(search.toLowerCase())), [classes, search]);

  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const classData = await apiJson<ClassRow[]>('/api/classes', { method: 'GET' });
      setClasses(classData);
      if (isPrincipalMode) {
        const [studentData, teacherData] = await Promise.all([
          apiJson<any[]>('/api/students', { method: 'GET' }),
          apiJson<any[]>('/api/teachers', { method: 'GET' }),
        ]);
        setStudents(studentData.map(s => ({ id: s.id, name: s.name, email: s.email, isActive: s.isActive })));
        setTeachers(teacherData.map(t => ({ id: t.id, name: t.name, email: t.email, isActive: t.isActive })));
      }
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrincipalMode]);

  async function createClass() {
    if (!isPrincipalMode) return;
    const name = createName.trim();
    if (!name) return;
    try {
      setCreating(true);
      const created = await apiJson<{ id: string; name: string; createdAt: string }>('/api/classes', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      showMessage('Class created', 'success');
      setCreateName('');
      setClasses(prev => [{ ...created, students: [], teachers: [] } as any, ...prev]);
      await load();
    } catch (e) {
      showError(e);
    } finally {
      setCreating(false);
    }
  }

  async function saveAssignments(classId: string, studentIds: string[], teacherIds: string[]) {
    try {
      await apiJson('/api/classes/assign', { method: 'PATCH', body: JSON.stringify({ classId, studentIds, teacherIds }) });
      showMessage('Assignments updated', 'success');
      await load();
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
              <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
              <p className="text-sm text-slate-600">{isPrincipalMode ? 'Create and assign students/teachers' : 'Only your assigned classes are shown'}</p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classes" className="px-3 py-2 border rounded-xl bg-white w-72" />
            <button onClick={load} className="px-3 py-2 border rounded-xl bg-white text-sm font-semibold">
              Refresh
            </button>
          </div>

          {isPrincipalMode && (
            <div className="bg-white border rounded-2xl p-4 flex gap-3 items-center">
              <input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="New class name" className="flex-1 px-3 py-2 border rounded-xl" />
              <button disabled={creating} onClick={createClass} className="px-4 py-2 rounded-xl bg-teal-950 text-white font-semibold text-sm disabled:opacity-50">
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          )}

          <div className="space-y-4">
            {loading ? (
              <div className="text-slate-500">Loading...</div>
            ) : filtered.length ? (
              filtered.map(c => (
                <div key={c.id} className="bg-white border rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-500">Students: {c.students.length} • Teachers: {c.teachers.length}</div>
                    </div>
                    {isPrincipalMode && (
                      <ClassAssignEditor
                        classRow={c}
                        allStudents={students}
                        allTeachers={teachers}
                        onSave={(studentIds, teacherIds) => saveAssignments(c.id, studentIds, teacherIds)}
                      />
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-600 mb-2">Students</div>
                      <div className="flex flex-wrap gap-2">
                        {c.students.length ? (
                          c.students.map(s => (
                            <span key={s.Student.id} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                              {s.Student.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-600 mb-2">Teachers</div>
                      <div className="flex flex-wrap gap-2">
                        {c.teachers.length ? (
                          c.teachers.map(t => (
                            <span key={t.Teacher.id} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                              {t.Teacher.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500">No classes</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ClassAssignEditor({
  classRow,
  allStudents,
  allTeachers,
  onSave,
}: {
  classRow: ClassRow;
  allStudents: UserLite[];
  allTeachers: UserLite[];
  onSave: (studentIds: string[], teacherIds: string[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [studentIds, setStudentIds] = useState<string[]>(classRow.students.map(s => s.Student.id));
  const [teacherIds, setTeacherIds] = useState<string[]>(classRow.teachers.map(t => t.Teacher.id));

  useEffect(() => {
    setStudentIds(classRow.students.map(s => s.Student.id));
    setTeacherIds(classRow.teachers.map(t => t.Teacher.id));
  }, [classRow.id, classRow.students, classRow.teachers]);

  async function save() {
    try {
      setSaving(true);
      await onSave(studentIds, teacherIds);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button onClick={() => setOpen(v => !v)} className="px-3 py-2 rounded-xl border text-sm font-semibold">
        {open ? 'Close' : 'Assign'}
      </button>
      {open && (
        <div className="mt-3 border rounded-2xl p-4 bg-slate-50 space-y-4">
          <div>
            <div className="text-xs font-bold text-slate-600 mb-2">Students</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-44 overflow-auto">
              {allStudents.map(s => (
                <label key={s.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={studentIds.includes(s.id)}
                    onChange={e => setStudentIds(prev => (e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id)))}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-600 mb-2">Teachers</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-44 overflow-auto">
              {allTeachers.map(t => (
                <label key={t.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={teacherIds.includes(t.id)}
                    onChange={e => setTeacherIds(prev => (e.target.checked ? [...prev, t.id] : prev.filter(x => x !== t.id)))}
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
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

