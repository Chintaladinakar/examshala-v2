'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { fetchJson } from '@/lib/api';
import Link from 'next/link';

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  attendanceId?: string;
  status: 'present' | 'absent' | 'unmarked';
}

interface Classroom {
  id: string;
  name: string;
  students: {
    Student: {
      id: string;
      name: string;
      email: string;
    };
  }[];
}

interface UserProfile {
  id: string;
  name: string;
  role: string;
  mode: string | null;
  workspaceName: string;
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
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

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const token = getCookie('session_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, classesRes] = await Promise.all([
        fetchJson<{ success: boolean; data: UserProfile }>('/api/school/profile', { headers }),
        fetchJson<{ success: boolean; data: Classroom[] }>('/api/school/classes', { headers }),
      ]);

      if (profileRes.success) setProfile(profileRes.data);
      if (classesRes.success && classesRes.data) {
        setClasses(classesRes.data);
        if (classesRes.data.length > 0) {
          setSelectedClassId(classesRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load initial attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = useCallback(async () => {
    if (!selectedClassId || !selectedDate || classes.length === 0) return;
    try {
      setLoadingStudents(true);
      setErrorMsg(null);
      const token = getCookie('session_token');
      const headers = { Authorization: `Bearer ${token}` };

      const attendanceRes = await fetchJson<{ success: boolean; data: any[] }>(
        `/api/school/attendance/class/${selectedClassId}?date=${selectedDate}`,
        { headers }
      ).catch(() => ({ success: false, data: [] }));

      const currentClass = classes.find(c => c.id === selectedClassId);
      if (!currentClass) return;

      const mapped: StudentRecord[] = currentClass.students.map(cs => {
        const studentInfo = cs.Student;
        const record = attendanceRes.data?.find((a: any) => a.studentId === studentInfo.id);
        return {
          id: studentInfo.id,
          name: studentInfo.name,
          email: studentInfo.email,
          attendanceId: record?.id,
          status: record ? record.status : 'unmarked',
        };
      });

      setStudents(mapped);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sync attendance.');
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedClassId, selectedDate, classes]);

  useEffect(() => { loadInitialData(); }, []);
  useEffect(() => { if (selectedClassId && selectedDate) loadAttendance(); }, [loadAttendance]);

  const isPrincipal = profile?.role.toLowerCase() === 'principal';
  const hoursDiff = (Date.now() - new Date(selectedDate + 'T00:00:00').getTime()) / (1000 * 60 * 60);
  const isLocked = hoursDiff >= 24;
  const canEdit = !isLocked || isPrincipal;

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const unmarkedCount = students.filter(s => s.status === 'unmarked').length;
  const attendancePct = students.length > 0 && unmarkedCount === 0
    ? Math.round((presentCount / students.length) * 100)
    : null;

  const handleToggleStatus = async (student: StudentRecord) => {
    if (!canEdit) {
      alert('🔒 Attendance is locked after 24 hours. Only the Principal can override.');
      return;
    }
    const nextStatus = student.status === 'present' ? 'absent' : 'present';

    if (student.attendanceId) {
      try {
        const token = getCookie('session_token');
        await fetchJson('/api/school/attendance/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ attendanceId: student.attendanceId, status: nextStatus }),
        });
        setStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: nextStatus } : s));
      } catch (err: any) {
        alert(`Update failed: ${err.message || 'Request failed'}`);
      }
    } else {
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, status: nextStatus } : s));
    }
  };

  const handleMarkAll = (status: 'present' | 'absent') => {
    if (!canEdit) return;
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSubmitAttendance = async () => {
    const unmarked = students.filter(s => s.status === 'unmarked');
    if (unmarked.length > 0) {
      alert(`Please mark attendance for all ${unmarked.length} remaining students.`);
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      const token = getCookie('session_token');
      const records = students.map(s => ({ studentId: s.id, status: s.status }));
      await fetchJson('/api/school/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ classId: selectedClassId, date: selectedDate, records }),
      });
      setSuccessMsg('✅ Attendance submitted successfully!');
      await loadAttendance();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  const allMarkedInDb = students.every(s => s.attendanceId !== undefined);
  const hasUnmarked = students.some(s => s.status === 'unmarked');
  const currentClassName = classes.find(c => c.id === selectedClassId)?.name || '';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Top Header Bar */}
        <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">Dashboard</Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600 text-sm font-semibold">Attendance</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance Logging</h1>
            <p className="text-slate-500 text-sm mt-0.5">Mark present/absent states and manage daily classroom records.</p>
          </div>
          <div className="flex items-center gap-3">
            {isLocked && (
              <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
                isPrincipal
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                🔒 {isPrincipal ? 'Locked — Principal Override Active' : 'Locked (Read-Only after 24h)'}
              </span>
            )}
            {!isLocked && (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                🟢 Open for Editing
              </span>
            )}
          </div>
        </div>

        <div className="p-8 max-w-6xl mx-auto space-y-6">

          {/* Selector Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-1.5 flex-1 min-w-0">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Classroom</label>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-800 transition-all text-sm"
              >
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-800 transition-all text-sm"
              />
            </div>
            {canEdit && students.length > 0 && (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleMarkAll('present')}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
                >
                  ✅ All Present
                </button>
                <button
                  onClick={() => handleMarkAll('absent')}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
                >
                  ❌ All Absent
                </button>
              </div>
            )}
          </div>

          {/* Stats Row */}
          {students.length > 0 && !loadingStudents && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Students', value: students.length, color: 'bg-slate-50 border-slate-200 text-slate-700', dot: 'bg-slate-400' },
                { label: 'Present', value: presentCount, color: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500' },
                { label: 'Absent', value: absentCount, color: 'bg-rose-50 border-rose-200 text-rose-700', dot: 'bg-rose-500' },
                { label: 'Unmarked', value: unmarkedCount, color: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-500' },
              ].map(stat => (
                <div key={stat.label} className={`${stat.color} border rounded-2xl p-4 flex items-center gap-3`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${stat.dot} shrink-0`} />
                  <div>
                    <div className="text-xs font-semibold opacity-70">{stat.label}</div>
                    <div className="text-2xl font-black">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Attendance % bar */}
          {attendancePct !== null && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-700">{currentClassName} — Attendance Rate</span>
                <span className={`text-lg font-black ${attendancePct >= 75 ? 'text-emerald-600' : attendancePct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {attendancePct}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${attendancePct >= 75 ? 'bg-emerald-500' : attendancePct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${attendancePct}%` }}
                />
              </div>
            </div>
          )}

          {/* Messages */}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold px-5 py-3.5 rounded-xl">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold px-5 py-3.5 rounded-xl">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Students Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading || loadingStudents ? (
              <div className="p-16 text-center space-y-3 animate-pulse">
                <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto" />
                <div className="h-3 bg-slate-100 rounded w-40 mx-auto" />
                <div className="h-3 bg-slate-100 rounded w-28 mx-auto" />
              </div>
            ) : students.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <span className="text-4xl block">👥</span>
                <h3 className="font-bold text-slate-700">No students enrolled</h3>
                <p className="text-slate-400 text-sm">This classroom has no students yet. Add students from the Students page.</p>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                          {canEdit ? 'Action' : 'Read-Only'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map(s => {
                        const statusConfig = {
                          present: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Present', dot: 'bg-emerald-500' },
                          absent: { badge: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Absent', dot: 'bg-rose-500' },
                          unmarked: { badge: 'bg-slate-50 text-slate-500 border-slate-200', label: 'Unmarked', dot: 'bg-slate-300' },
                        }[s.status];

                        return (
                          <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                  {s.name ? s.name.substring(0, 2).toUpperCase() : 'ST'}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-800 text-sm">{s.name}</div>
                                  <div className="text-slate-400 text-xs">{s.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusConfig.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {canEdit ? (
                                <button
                                  onClick={() => handleToggleStatus(s)}
                                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                    s.status === 'present'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                >
                                  {s.status === 'present' ? '→ Mark Absent' : '→ Mark Present'}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Locked</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {canEdit && (!allMarkedInDb || hasUnmarked) && (
                  <div className="px-6 py-5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div className="text-sm text-slate-500">
                      {hasUnmarked
                        ? `⚠️ ${unmarkedCount} student${unmarkedCount > 1 ? 's' : ''} still unmarked`
                        : '✅ All students marked — ready to submit'}
                    </div>
                    <button
                      onClick={handleSubmitAttendance}
                      disabled={submitting || hasUnmarked}
                      className="bg-teal-900 hover:bg-teal-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {submitting ? 'Submitting...' : 'Submit Attendance Sheet'}
                    </button>
                  </div>
                )}

                {isLocked && isPrincipal && allMarkedInDb && (
                  <div className="px-6 py-4 bg-amber-50/60 border-t border-amber-100">
                    <p className="text-xs text-amber-700 font-semibold">
                      🔑 Principal override active — you can still edit locked attendance records.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
