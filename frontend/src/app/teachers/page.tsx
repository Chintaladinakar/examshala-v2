'use client';

import React, { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { fetchJson } from '@/lib/api';

interface Teacher {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  classTeachers: {
    Class: {
      id: string;
      name: string;
    };
  }[];
}

interface UserProfile {
  role: string;
  mode: string | null;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

      const [profileRes, teachersRes] = await Promise.all([
        fetchJson<{ success: boolean; data: UserProfile }>('/api/school/profile', { headers }),
        fetchJson<{ success: boolean; data: Teacher[] }>('/api/school/teachers', { headers }).catch(() => ({ success: false, data: [] })),
      ]);

      if (profileRes.success) setProfile(profileRes.data);
      if (teachersRes.success && teachersRes.data) setTeachers(teachersRes.data);
    } catch (err) {
      console.error('Failed to load teachers page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isPrincipalMode = profile?.role.toLowerCase() === 'principal' && profile?.mode === 'principal';

  // Filter teachers
  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#FDFBF7]">
      <DashboardSidebar />

      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Staff Management</h1>
            <p className="text-slate-500 mt-1">Review active educators, teacher roles, and workspace mappings.</p>
          </div>

          {!isPrincipalMode ? (
            <div className="bg-rose-50 border border-rose-150 p-6 md:p-8 rounded-2xl max-w-xl mx-auto text-center space-y-4 shadow-sm mt-12">
              <span className="text-4xl block">🔒</span>
              <h2 className="text-lg font-bold text-rose-900">Access Restricted</h2>
              <p className="text-sm text-rose-700">
                Staff directories and teacher mapping panels are restricted strictly to **Principal oversight mode**. If you are a Principal, please switch back to Principal Mode in the sidebar to review this screen.
              </p>
            </div>
          ) : (
            <>
              {/* Search Bar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] relative max-w-md">
                <span className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none text-slate-400 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search teachers by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
                />
              </div>

              {/* Roster Table */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] overflow-hidden">
                {loading ? (
                  <div className="p-16 text-center text-slate-400 animate-pulse">
                    <span className="text-2xl block mb-2">⏳</span>
                    <p className="text-sm font-semibold">Loading teacher registry...</p>
                  </div>
                ) : filteredTeachers.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 space-y-2">
                    <span className="text-3xl block">👥</span>
                    <h3 className="font-bold text-slate-700">No teachers found</h3>
                    <p className="text-xs max-w-xs mx-auto">Verify that you have registered teacher members in your workspace.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="px-6 py-4">Teacher Details</th>
                          <th className="px-6 py-4">Assigned Classrooms</th>
                          <th className="px-6 py-4">System Status</th>
                          <th className="px-6 py-4">Joined Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTeachers.map(teacher => {
                          const joinedDate = new Date(teacher.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          });

                          return (
                            <tr key={teacher.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="px-6 py-4.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8.5 h-8.5 rounded-full bg-slate-50 border border-slate-100 text-xs font-bold text-slate-650 flex items-center justify-center shrink-0">
                                    {teacher.name ? teacher.name.substring(0, 2).toUpperCase() : 'TC'}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-800 text-sm">{teacher.name}</div>
                                    <div className="text-slate-400 text-xs">{teacher.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4.5 max-w-md">
                                <div className="flex flex-wrap gap-1.5">
                                  {teacher.classTeachers && teacher.classTeachers.length > 0 ? (
                                    teacher.classTeachers.map(ct => (
                                      <span key={ct.Class.id} className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-100/80 px-2.5 py-0.5 rounded-full">
                                        {ct.Class.name}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">No assigned classes</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  teacher.isActive
                                    ? 'bg-emerald-50 text-emerald-850 border-emerald-100/80'
                                    : 'bg-rose-50 text-rose-850 border-rose-100/80'
                                }`}>
                                  {teacher.isActive ? 'ACTIVE' : 'SUSPENDED'}
                                </span>
                              </td>
                              <td className="px-6 py-4.5">
                                <span className="text-xs text-slate-400 font-medium">{joinedDate}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
