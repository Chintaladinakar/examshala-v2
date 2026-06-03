'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import {
  Building2,
  Users,
  GraduationCap,
  Search,
  PlusCircle,
  RefreshCw,
  Sliders,
  X,
  CheckCircle2,
  FolderOpen,
  Plus,
  Sparkles,
  ArrowUpRight,
  UserCheck,
  Calendar
} from 'lucide-react';

type UserLite = { id: string; name: string; email: string; isActive: boolean };
type ClassRow = {
  id: string;
  name: string;
  createdAt: string;
  students: { Student: UserLite }[];
  teachers: { Teacher: UserLite }[];
};

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || 'Request failed');
  }
  return body.data as T;
}

export default function ClassesPage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();

  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal';

  // State
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<UserLite[]>([]);
  const [teachers, setTeachers] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);

  // Assignment Modal
  const [assignClassRow, setAssignClassRow] = useState<ClassRow | null>(null);

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [classes, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum, c) => sum + c.students.length, 0);
    const totalTeachers = classes.reduce((sum, c) => sum + c.teachers.length, 0);
    const avgStudents = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;
    return { totalClasses, totalStudents, totalTeachers, avgStudents };
  }, [classes]);

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
        setStudents(studentData.map((s) => ({ id: s.id, name: s.name, email: s.email, isActive: s.isActive })));
        setTeachers(teacherData.map((t) => ({ id: t.id, name: t.name, email: t.email, isActive: t.isActive })));
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

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!isPrincipalMode) return;
    const name = createName.trim();
    if (!name) return;

    try {
      setCreating(true);
      const created = await apiJson<{ id: string; name: string; createdAt: string }>('/api/classes', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      showMessage(`Class "${name}" registered successfully`, 'success');
      setCreateName('');
      setCreateModalOpen(false);
      setClasses((prev) => [{ ...created, students: [], teachers: [] } as any, ...prev]);
      await load();
    } catch (e) {
      showError(e);
    } finally {
      setCreating(false);
    }
  }

  async function saveAssignments(classId: string, studentIds: string[], teacherIds: string[]) {
    try {
      await apiJson('/api/classes/assign', {
        method: 'PATCH',
        body: JSON.stringify({ classId, studentIds, teacherIds }),
      });
      showMessage('Class roster assignments updated', 'success');
      await load();
    } catch (e) {
      showError(e);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto select-none">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-8 h-8 text-teal-850" />
                Class Divisions
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                {isPrincipalMode
                  ? 'Establish divisions, manage curricula, and assign students/faculty teachers.'
                  : 'View classes and assignments active in your workspace.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-4 py-2 border hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Roster
              </button>

              {isPrincipalMode && (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create Class
                </button>
              )}
            </div>
          </div>

          {/* Stats Summary Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div className="bg-white border p-5 rounded-2xl shadow-3xs flex items-center gap-4">
              <div className="w-10 h-10 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center text-teal-700 font-black text-sm">
                🏫
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Classes</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{stats.totalClasses}</p>
              </div>
            </div>

            <div className="bg-white border p-5 rounded-2xl shadow-3xs flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-black text-sm">
                🎓
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assigned Students</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{stats.totalStudents}</p>
              </div>
            </div>

            <div className="bg-white border p-5 rounded-2xl shadow-3xs flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-700 font-black text-sm">
                👨‍🏫
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Faculty</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{stats.totalTeachers}</p>
              </div>
            </div>

            <div className="bg-white border p-5 rounded-2xl shadow-3xs flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-black text-sm">
                📊
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Average Class Size</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{stats.avgStudents}</p>
              </div>
            </div>
          </div>

          {/* Filtering Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 border rounded-2xl shadow-3xs">
            <div>
              <h3 className="text-sm font-black text-slate-800">Class Roster Directories</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Explore active classroom segments</p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search classes by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700/35 transition-all"
              />
            </div>
          </div>

          {/* Grid of Class Cards */}
          {loading ? (
            <div className="bg-white border rounded-3xl p-16 text-center text-xs font-bold text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-teal-800 mx-auto mb-2" />
              Syncing workspace classes registry...
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="bg-white border rounded-3xl p-16 text-center select-none">
              <FolderOpen className="w-12 h-12 text-slate-350 mx-auto mb-2" />
              <h4 className="text-sm font-black text-slate-700">No Divisions Mapped</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Add grade segments or verify filter parameters to populate roster cards.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredClasses.map((c) => {
                const maxAvatars = 6;
                const visibleStudents = c.students.slice(0, maxAvatars);
                const remainingStudents = c.students.length - maxAvatars;

                return (
                  <div
                    key={c.id}
                    className="bg-white border border-slate-200/60 p-6 rounded-3xl shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-5"
                  >
                    {/* Top Segment: Class title & member counts */}
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-black text-slate-800 tracking-tight leading-snug">
                            {c.name}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                            Created: {new Date(c.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {isPrincipalMode && (
                          <button
                            onClick={() => setAssignClassRow(c)}
                            className="px-3 py-1.5 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-850 font-extrabold text-[10px] uppercase tracking-wide rounded-lg transition-all cursor-pointer shadow-3xs"
                          >
                            Assign members
                          </button>
                        )}
                      </div>

                      {/* Overlapping Student Initials Face Pile */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                          Students ({c.students.length})
                        </span>
                        {c.students.length > 0 ? (
                          <div className="flex items-center gap-1.5 pt-1">
                            <div className="flex -space-x-2.5 overflow-hidden">
                              {visibleStudents.map((cs) => {
                                const initials = cs.Student.name
                                  .trim()
                                  .split(/\s+/)
                                  .map((w: string) => w[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase();
                                return (
                                  <div
                                    key={cs.Student.id}
                                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 border text-[9px] font-black text-slate-650 flex items-center justify-center select-none shadow-sm shrink-0"
                                    title={cs.Student.name}
                                  >
                                    {initials}
                                  </div>
                                );
                              })}
                              {remainingStudents > 0 && (
                                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-teal-50 border text-[8px] font-black text-teal-800 flex items-center justify-center select-none shadow-sm shrink-0">
                                  +{remainingStudents}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No students assigned to roster.</p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Segment: Teachers assigned */}
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                        Assigned Faculty ({c.teachers.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {c.teachers.length > 0 ? (
                          c.teachers.map((t) => (
                            <span
                              key={t.Teacher.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/50 text-[10px] font-semibold text-slate-650"
                            >
                              <GraduationCap className="w-3 h-3 text-slate-400 shrink-0" />
                              {t.Teacher.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No faculty assigned.</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ─── CREATE CLASS MODAL ──────────────────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-teal-950 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-400" /> Create Grade Class
                </h3>
                <p className="text-[10px] text-teal-200 mt-0.5">
                  Establishes a new catalog section inside the school workspace.
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-teal-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Class Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 10B"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border hover:bg-slate-50 font-extrabold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl disabled:opacity-50 transition-all cursor-pointer"
                >
                  {creating ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ASSIGN MEMBERS MODAL (Principal editor) ─────────────────────────── */}
      {assignClassRow && (
        <ClassAssignModal
          classRow={assignClassRow}
          allStudents={students}
          allTeachers={teachers}
          onClose={() => setAssignClassRow(null)}
          onSave={async (studentIds, teacherIds) => {
            await saveAssignments(assignClassRow.id, studentIds, teacherIds);
            setAssignClassRow(null);
          }}
        />
      )}
    </div>
  );
}

// ─── ASSIGN MEMBERS EDITOR COMPONENT ─────────────────────────────────────────
function ClassAssignModal({
  classRow,
  allStudents,
  allTeachers,
  onClose,
  onSave,
}: {
  classRow: ClassRow;
  allStudents: UserLite[];
  allTeachers: UserLite[];
  onClose: () => void;
  onSave: (studentIds: string[], teacherIds: string[]) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');

  // Local state selections
  const [studentIds, setStudentIds] = useState<string[]>(classRow.students.map((s) => s.Student.id));
  const [teacherIds, setTeacherIds] = useState<string[]>(classRow.teachers.map((t) => t.Teacher.id));

  // Searches
  const [studentQuery, setStudentQuery] = useState('');
  const [teacherQuery, setTeacherQuery] = useState('');

  // Filter lists based on search
  const filteredStudents = useMemo(() => {
    return allStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(studentQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(studentQuery.toLowerCase())
    );
  }, [allStudents, studentQuery]);

  const filteredTeachers = useMemo(() => {
    return allTeachers.filter(
      (t) =>
        t.name.toLowerCase().includes(teacherQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(teacherQuery.toLowerCase())
    );
  }, [allTeachers, teacherQuery]);

  async function handleSave() {
    try {
      setSaving(true);
      await onSave(studentIds, teacherIds);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] select-none">
        
        {/* Header */}
        <div className="bg-teal-950 p-6 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-black flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" /> Assign Members: {classRow.name}
            </h3>
            <p className="text-[10px] text-teal-200 mt-0.5">
              Modify student roster mappings and faculty supervisor assignments.
            </p>
          </div>
          <button onClick={onClose} className="text-teal-300 hover:text-white transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex border-b border-slate-200 shrink-0 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 cursor-pointer transition-all ${
              activeTab === 'students' ? 'border-teal-700 text-teal-850' : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            Students Roster ({studentIds.length} Selected)
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 cursor-pointer transition-all ${
              activeTab === 'teachers' ? 'border-teal-700 text-teal-850' : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            Faculty Teachers ({teacherIds.length} Selected)
          </button>
        </div>

        {/* Search Inputs (Contextual) */}
        <div className="p-4 border-b border-slate-100 shrink-0 bg-white">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'students' ? 'Filter students roster...' : 'Filter teachers supervisor list...'}
              value={activeTab === 'students' ? studentQuery : teacherQuery}
              onChange={(e) => (activeTab === 'students' ? setStudentQuery(e.target.value) : setTeacherQuery(e.target.value))}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700/35"
            />
          </div>
        </div>

        {/* Selection Area (Scrollable flex list) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
          
          {activeTab === 'students' ? (
            filteredStudents.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400 italic">No matching students found</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredStudents.map((s) => {
                  const isChecked = studentIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-black shadow-3xs'
                          : 'bg-white border-slate-200/60 hover:bg-slate-50 text-slate-650'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setStudentIds((prev) => (e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id)))
                        }
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs truncate block leading-snug">{s.name}</span>
                        <span className="text-[9px] text-slate-400 font-semibold truncate block mt-0.5">{s.email}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )
          ) : (
            filteredTeachers.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400 italic">No matching teachers found</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTeachers.map((t) => {
                  const isChecked = teacherIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-teal-50 border-teal-200 text-teal-950 font-black shadow-3xs'
                          : 'bg-white border-slate-200/60 hover:bg-slate-50 text-slate-650'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setTeacherIds((prev) => (e.target.checked ? [...prev, t.id] : prev.filter((x) => x !== t.id)))
                        }
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs truncate block leading-snug">{t.name}</span>
                        <span className="text-[9px] text-slate-400 font-semibold truncate block mt-0.5">{t.email}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border hover:bg-slate-50 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? 'Saving Assignments...' : 'Save Assignments'}
          </button>
        </div>

      </div>
    </div>
  );
}
