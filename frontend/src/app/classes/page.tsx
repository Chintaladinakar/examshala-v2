'use client';

import React, { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { fetchJson } from '@/lib/api';

interface Classroom {
  id: string;
  name: string;
  createdAt: string;
  teachers: {
    Teacher: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  students: {
    Student: {
      id: string;
      name: string;
    };
  }[];
}

interface Teacher {
  id: string;
  name: string;
}

interface UserProfile {
  role: string;
  mode: string | null;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals / forms
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [classSubmitting, setClassSubmitting] = useState(false);

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkClassId, setLinkClassId] = useState('');
  const [linkTeacherId, setLinkTeacherId] = useState('');
  const [linkSubmitting, setLinkSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const token = getCookie('session_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, classesRes, teachersRes] = await Promise.all([
        fetchJson<{ success: boolean; data: UserProfile }>('/api/school/profile', { headers }),
        fetchJson<{ success: boolean; data: Classroom[] }>('/api/school/classes', { headers }),
        fetchJson<{ success: boolean; data: Teacher[] }>('/api/school/teachers', { headers }).catch(() => ({ success: false, data: [] })),
      ]);

      if (profileRes.success) setProfile(profileRes.data);
      if (classesRes.success && classesRes.data) setClasses(classesRes.data);
      if (teachersRes.success && teachersRes.data) setTeachers(teachersRes.data);
    } catch (err) {
      console.error('Failed to load classes data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;

    try {
      setClassSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const token = getCookie('session_token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      await fetchJson('/api/school/classes/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newClassName }),
      });

      setSuccessMsg(`Successfully created classroom "${newClassName}"!`);
      setNewClassName('');
      
      await loadData();

      setTimeout(() => {
        setClassModalOpen(false);
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create classroom.');
    } finally {
      setClassSubmitting(false);
    }
  };

  const handleLinkTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkClassId || !linkTeacherId) return;

    try {
      setLinkSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const token = getCookie('session_token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      await fetchJson('/api/school/classes/link-teacher', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          classId: linkClassId,
          teacherId: linkTeacherId,
        }),
      });

      setSuccessMsg('Teacher mapped to classroom successfully!');
      setLinkClassId('');
      setLinkTeacherId('');

      await loadData();

      setTimeout(() => {
        setLinkModalOpen(false);
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to map teacher.');
    } finally {
      setLinkSubmitting(false);
    }
  };

  const isPrincipal = profile?.role.toLowerCase() === 'principal';
  const isPrincipalMode = isPrincipal && profile?.mode === 'principal';

  return (
    <div className="flex min-h-screen bg-[#FDFBF7]">
      <DashboardSidebar />

      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Classrooms</h1>
              <p className="text-slate-500 mt-1">Manage workspace classrooms, link staff members, and track enrollments.</p>
            </div>
            {isPrincipalMode && (
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => setLinkModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4.5 py-2.5 rounded-xl text-sm transition-all shadow-sm border border-slate-200 cursor-pointer"
                >
                  🔗 Assign Teacher
                </button>
                <button
                  onClick={() => setClassModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 bg-teal-950 hover:bg-teal-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm border border-teal-850 cursor-pointer"
                >
                  ➕ Create Classroom
                </button>
              </div>
            )}
          </div>

          {/* Classroom Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white h-48 rounded-2xl border border-slate-200/60 p-6"></div>
              ))}
            </div>
          ) : classes.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-2xl bg-white">
              <span className="text-3xl block">🏫</span>
              <h3 className="font-bold text-slate-700">No classrooms created</h3>
              <p className="text-xs max-w-xs mx-auto">Create classrooms to start tracking students and assigning educators.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map(cls => (
                <div 
                  key={cls.id}
                  className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between gap-5 hover:shadow-[0_6px_25px_rgba(0,0,0,0.02)] transition-all duration-300 relative"
                >
                  {/* Classroom name & info */}
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-slate-800 text-base">{cls.name}</h3>
                      <span className="text-[10px] font-bold text-teal-855 bg-teal-50 border border-teal-100/60 px-2 py-0.5 rounded-full shrink-0">
                        {cls.students?.length || 0} students
                      </span>
                    </div>

                    {/* Mapped teachers block */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Educators</span>
                      <div className="flex flex-wrap gap-1">
                        {cls.teachers && cls.teachers.length > 0 ? (
                          cls.teachers.map(t => (
                            <span key={t.Teacher.id} className="text-[10px] font-bold text-slate-650 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-full">
                              👨‍🏫 {t.Teacher.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No teacher linked</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Joined Date footer */}
                  <div className="text-[10px] text-slate-350 font-medium pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span>Created At</span>
                    <span>{new Date(cls.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Classroom Modal */}
          {classModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-teal-950/40 backdrop-blur-sm" onClick={() => setClassModalOpen(false)} />
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 md:p-8 relative z-10 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => setClassModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                >
                  ✕
                </button>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Create Classroom</h3>
                    <p className="text-xs text-slate-500 mt-1">Initialize a new classroom in this workspace.</p>
                  </div>

                  {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl">
                      🎉 {successMsg}
                    </div>
                  )}

                  {errorMsg && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold px-4 py-3 rounded-xl">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleCreateClass} className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Classroom Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Grade 10 Science, Class A"
                        value={newClassName}
                        onChange={e => setNewClassName(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
                      />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setClassModalOpen(false)}
                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={classSubmitting}
                        className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {classSubmitting ? 'Creating...' : 'Create Classroom'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Assign Teacher Modal */}
          {linkModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-teal-950/40 backdrop-blur-sm" onClick={() => setLinkModalOpen(false)} />
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 md:p-8 relative z-10 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => setLinkModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                >
                  ✕
                </button>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Map Teacher to Classroom</h3>
                    <p className="text-xs text-slate-500 mt-1">Assign an educator to direct class curriculums.</p>
                  </div>

                  {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl">
                      🎉 {successMsg}
                    </div>
                  )}

                  {errorMsg && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold px-4 py-3 rounded-xl">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleLinkTeacher} className="space-y-4 pt-2">
                    {/* Class */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Classroom</label>
                      <select
                        required
                        value={linkClassId}
                        onChange={e => setLinkClassId(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
                      >
                        <option value="">Select Classroom...</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Teacher */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Educator</label>
                      <select
                        required
                        value={linkTeacherId}
                        onChange={e => setLinkTeacherId(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
                      >
                        <option value="">Select Teacher...</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setLinkModalOpen(false)}
                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={linkSubmitting}
                        className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {linkSubmitting ? 'Mapping...' : 'Map Teacher'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
