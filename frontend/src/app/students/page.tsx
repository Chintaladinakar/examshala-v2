'use client';

import React, { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { fetchJson } from '@/lib/api';

interface Student {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  className: string;
  classId: string;
}

interface Classroom {
  id: string;
  name: string;
}

interface UserProfile {
  role: string;
  mode: string | null;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Add Student modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentClassId, setStudentClassId] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

      // Load Profile & Classes concurrently
      const [profileRes, classesRes] = await Promise.all([
        fetchJson<{ success: boolean; data: UserProfile }>('/api/school/profile', { headers }),
        fetchJson<{ success: boolean; data: any[] }>('/api/school/classes', { headers }),
      ]);

      if (profileRes.success) setProfile(profileRes.data);

      const classrooms: Classroom[] = [];
      const flatStudents: Student[] = [];

      if (classesRes.success && classesRes.data) {
        classesRes.data.forEach((c: any) => {
          classrooms.push({ id: c.id, name: c.name });
          
          if (c.students && Array.isArray(c.students)) {
            c.students.forEach((s: any) => {
              flatStudents.push({
                id: s.Student.id,
                name: s.Student.name,
                email: s.Student.email,
                isActive: s.Student.isActive,
                className: c.name,
                classId: c.id,
              });
            });
          }
        });
      }

      setClasses(classrooms);
      setStudents(flatStudents);
    } catch (err) {
      console.error('Failed to load students data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleActive = async (student: Student) => {
    if (profile?.role.toLowerCase() !== 'principal') {
      alert('Only the Principal is authorized to enable/disable user accounts.');
      return;
    }

    try {
      const token = getCookie('session_token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const nextActive = !student.isActive;

      await fetchJson('/api/school/users/activate', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          targetUserId: student.id,
          isActive: nextActive,
        }),
      });

      // Optimistic update
      setStudents(prev =>
        prev.map(s => (s.id === student.id ? { ...s, isActive: nextActive } : s))
      );
    } catch (err: any) {
      alert(`Action failed: ${err.message || 'Request failed'}`);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentEmail) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const token = getCookie('session_token');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const body: any = {
        name: studentName,
        email: studentEmail,
      };
      if (studentPassword) body.password = studentPassword;
      if (studentClassId) body.classId = studentClassId;

      await fetchJson('/api/school/students/add', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      setSuccessMsg(`Successfully registered student "${studentName}"!`);
      setStudentName('');
      setStudentEmail('');
      setStudentPassword('');
      setStudentClassId('');
      
      // Reload students
      await loadData();

      setTimeout(() => {
        setAddModalOpen(false);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register student.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter students array
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter ? s.classId === classFilter : true;
    return matchesSearch && matchesClass;
  });

  const isPrincipal = profile?.role.toLowerCase() === 'principal';

  return (
    <div className="flex min-h-screen bg-[#FDFBF7]">
      <DashboardSidebar />

      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Student Management</h1>
              <p className="text-slate-500 mt-1">Enroll students, classroom assignments, and active account settings.</p>
            </div>
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-teal-950 hover:bg-teal-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm border border-teal-850 shrink-0 cursor-pointer"
            >
              ➕ Register Student
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Search */}
            <div className="relative md:col-span-2">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
              />
            </div>
            {/* Class filter */}
            <div>
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
              >
                <option value="">All Classrooms</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] overflow-hidden">
            {loading && students.length === 0 ? (
              <div className="p-16 text-center text-slate-400 animate-pulse">
                <span className="text-2xl block mb-2">⏳</span>
                <p className="text-sm font-semibold">Loading student roster...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-16 text-center text-slate-400 space-y-2">
                <span className="text-3xl block">👥</span>
                <h3 className="font-bold text-slate-700">No students found</h3>
                <p className="text-xs max-w-xs mx-auto">Try refining your search terms or filter mapping parameters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Student Details</th>
                      <th className="px-6 py-4">Classroom</th>
                      <th className="px-6 py-4">System Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8.5 h-8.5 rounded-full bg-slate-50 border border-slate-100 text-xs font-bold text-slate-650 flex items-center justify-center shrink-0">
                              {student.name ? student.name.substring(0, 2).toUpperCase() : 'ST'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-sm">{student.name}</div>
                              <div className="text-slate-400 text-xs">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className="text-xs text-slate-700 font-semibold bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 rounded-full">
                            {student.className}
                          </span>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            student.isActive
                              ? 'bg-emerald-50 text-emerald-850 border-emerald-100/80'
                              : 'bg-rose-50 text-rose-850 border-rose-100/80'
                          }`}>
                            {student.isActive ? 'ACTIVE' : 'SUSPENDED'}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-right">
                          <button
                            onClick={() => handleToggleActive(student)}
                            disabled={!isPrincipal}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              student.isActive
                                ? 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                            title={isPrincipal ? '' : 'Only the Principal can suspend student accounts.'}
                          >
                            {student.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add Student Modal */}
          {addModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-teal-950/40 backdrop-blur-sm" onClick={() => setAddModalOpen(false)} />
              
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 md:p-8 relative z-10 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                >
                  ✕
                </button>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Register Student</h3>
                    <p className="text-xs text-slate-500 mt-1">Add a new student profile in this workspace and assign them to a classroom.</p>
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

                  <form onSubmit={handleAddStudent} className="space-y-4 pt-2">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Student's Name"
                        value={studentName}
                        onChange={e => setStudentName(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="name@school.com"
                        value={studentEmail}
                        onChange={e => setStudentEmail(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Password <span className="text-slate-400 lowercase italic">(optional)</span></label>
                      <input
                        type="password"
                        placeholder="Leave blank for student default"
                        value={studentPassword}
                        onChange={e => setStudentPassword(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
                      />
                    </div>

                    {/* Class Mapping */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Classroom Assignment</label>
                      <select
                        required
                        value={studentClassId}
                        onChange={e => setStudentClassId(e.target.value)}
                        className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
                      >
                        <option value="">Select Classroom...</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Submissions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setAddModalOpen(false)}
                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? 'Registering...' : 'Register Student'}
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
