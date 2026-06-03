'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import {
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  Check,
  X,
  UserCheck,
  UserMinus,
  Sparkles,
  AlertCircle,
  FolderOpen,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Sliders,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';

type ClassLite = { id: string; name: string; students?: any[]; teachers?: any[] };
type AttendanceRecord = { id: string; status: 'present' | 'absent'; isLocked: boolean; createdAt: string };
type StudentRow = { id: string; name: string; email: string; isActive: boolean; attendance: AttendanceRecord | null };

type ClassSummary = {
  present: number;
  absent: number;
  total: number;
  unmarked: number;
  rate: number;
  status: 'Completed' | 'In Progress' | 'Unmarked';
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

function yyyyMmDd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();

  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal';

  // State
  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [date, setDate] = useState(yyyyMmDd(new Date()));
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classSummaries, setClassSummaries] = useState<Record<string, ClassSummary>>({});
  
  // Loading states
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Search & Filtering
  const [classSearch, setClassSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'present' | 'absent' | 'unmarked'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Bulk action loader
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Reset page when roster parameters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClassId, studentSearch, statusTab, pageSize]);

  async function loadClasses() {
    try {
      setLoadingClasses(true);
      const data = await apiJson<ClassLite[]>('/api/classes', { method: 'GET' });
      setClasses(data);
    } catch (e) {
      showError(e);
    } finally {
      setLoadingClasses(false);
    }
  }

  // Load summaries in parallel for the school view
  async function loadSummaries(classList: ClassLite[]) {
    if (classList.length === 0) return;
    try {
      setLoadingSummaries(true);
      const summariesMap: Record<string, ClassSummary> = {};

      await Promise.all(
        classList.map(async (cls) => {
          try {
            const data = await apiJson<{ class: ClassLite; date: string; students: StudentRow[] }>(
              `/api/attendance?classId=${encodeURIComponent(cls.id)}&date=${encodeURIComponent(date)}`
            );
            const total = data.students.length;
            const present = data.students.filter((s) => s.attendance?.status === 'present').length;
            const absent = data.students.filter((s) => s.attendance?.status === 'absent').length;
            const unmarked = total - (present + absent);
            const rate = total > 0 ? Math.round((present / total) * 100) : 100;

            let status: 'Completed' | 'In Progress' | 'Unmarked' = 'Unmarked';
            if (unmarked === 0 && total > 0) status = 'Completed';
            else if (unmarked < total) status = 'In Progress';

            summariesMap[cls.id] = { present, absent, total, unmarked, rate, status };
          } catch (e) {
            console.error(`Failed to load summary for class ${cls.id}:`, e);
          }
        })
      );

      setClassSummaries(summariesMap);
    } catch (e) {
      console.error('Failed to load class attendance summaries:', e);
    } finally {
      setLoadingSummaries(false);
    }
  }

  // Load detailed roster for a specific class
  async function loadRoster() {
    if (!selectedClassId || !date) return;
    try {
      setLoadingRoster(true);
      const data = await apiJson<{ class: ClassLite; date: string; students: StudentRow[] }>(
        `/api/attendance?classId=${encodeURIComponent(selectedClassId)}&date=${encodeURIComponent(date)}`,
        { method: 'GET' }
      );
      setStudents(data.students);
    } catch (e) {
      showError(e);
    } finally {
      setLoadingRoster(false);
    }
  }

  // Initial load
  useEffect(() => {
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch summaries whenever class list or date changes
  useEffect(() => {
    if (classes.length > 0) {
      loadSummaries(classes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes, date]);

  // Fetch detailed roster when a class is selected
  useEffect(() => {
    if (selectedClassId) {
      loadRoster();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, date]);

  // Update single student attendance status
  async function handleSetStatus(student: StudentRow, targetStatus: 'present' | 'absent') {
    if (student.attendance?.status === targetStatus) return;

    try {
      if (!student.attendance) {
        await apiJson('/api/attendance', {
          method: 'POST',
          body: JSON.stringify({
            classId: selectedClassId,
            date,
            entries: [{ studentId: student.id, status: targetStatus }],
          }),
        });
        showMessage(`Attendance logged: ${student.name} marked ${targetStatus}`, 'success');
        await loadRoster();
      } else {
        const updated = await apiJson<AttendanceRecord>('/api/attendance', {
          method: 'PATCH',
          body: JSON.stringify({ attendanceId: student.attendance.id, status: targetStatus }),
        });
        setStudents((prev) =>
          prev.map((s) => (s.id === student.id ? { ...s, attendance: { ...s.attendance!, ...updated } } : s))
        );
        showMessage(`Attendance updated: ${student.name} marked ${targetStatus}`, 'success');
      }
      // Reload summaries silently to reflect changes on dashboard back button
      loadSummaries(classes);
    } catch (e: any) {
      if (String(e?.message || '').toLowerCase().includes('locked')) {
        showMessage('Record locked (requires principal override)', 'info');
      }
      showError(e);
    }
  }

  // Bulk status update
  async function handleBulkMark(targetStatus: 'present' | 'absent') {
    if (!selectedClassId || students.length === 0) return;
    const confirm = window.confirm(`Mark all ${students.length} students as ${targetStatus}?`);
    if (!confirm) return;

    try {
      setBulkActionLoading(true);
      const entries = students
        .filter((s) => !s.attendance?.isLocked || isPrincipalMode)
        .map((s) => ({
          studentId: s.id,
          status: targetStatus,
        }));

      if (entries.length === 0) {
        showMessage('No editable records (all records are locked)', 'info');
        return;
      }

      await apiJson('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClassId,
          date,
          entries,
        }),
      });

      showMessage(`Roster bulk marked: All students set to ${targetStatus}`, 'success');
      await loadRoster();
      loadSummaries(classes);
    } catch (e: any) {
      showError(e);
    } finally {
      setBulkActionLoading(false);
    }
  }

  // School-Wide Aggregated Stats
  const schoolStats = useMemo(() => {
    let total = 0;
    let present = 0;
    let absent = 0;
    let unmarked = 0;
    let locked = 0;

    Object.values(classSummaries).forEach((sum) => {
      total += sum.total;
      present += sum.present;
      absent += sum.absent;
      unmarked += sum.unmarked;
    });

    const rate = total > 0 ? Math.round((present / total) * 100) : 100;
    return { total, present, absent, unmarked, rate };
  }, [classSummaries]);

  // Selected Class stats
  const activeClassStats = useMemo(() => {
    const total = students.length;
    const present = students.filter((s) => s.attendance?.status === 'present').length;
    const absent = students.filter((s) => s.attendance?.status === 'absent').length;
    const unmarked = total - (present + absent);
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;
    const locked = students.filter((s) => s.attendance?.isLocked).length;
    return { total, present, absent, unmarked, rate, locked };
  }, [students]);

  // Filtered Classes for Top-Level Grid
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => c.name.toLowerCase().includes(classSearch.toLowerCase()));
  }, [classes, classSearch]);

  // Filtered Students for drill-down
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase());

      let matchesTab = true;
      if (statusTab === 'present') {
        matchesTab = s.attendance?.status === 'present';
      } else if (statusTab === 'absent') {
        matchesTab = s.attendance?.status === 'absent';
      } else if (statusTab === 'unmarked') {
        matchesTab = !s.attendance;
      }

      return matchesSearch && matchesTab;
    });
  }, [students, studentSearch, statusTab]);

  // Paginated Students Roster
  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Selected Class Name
  const selectedClassName = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId)?.name || 'Class Roster';
  }, [classes, selectedClassId]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto select-none">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-8 h-8 text-teal-850" />
                School Attendance Hub
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                {selectedClassId ? 'Drilled down: Roster registry control' : 'Top-Level institutional overview'}
                {isPrincipalMode && (
                  <span className="text-violet-750 font-extrabold ml-1.5 bg-violet-50 border border-violet-150 px-2 py-0.5 rounded-md inline-block">
                    🛡️ Administrator Override Mode
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedClassId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedClassId(val === '' ? null : val);
                }}
                className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-700/35 shadow-3xs transition-all cursor-pointer"
              >
                <option value="">🏫 All Class Overview</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3.5 py-2 border rounded-xl bg-white text-xs font-semibold text-slate-700 focus:outline-none shadow-3xs"
              />
              <button
                onClick={() => {
                  loadClasses();
                  if (selectedClassId) loadRoster();
                }}
                disabled={loadingClasses || loadingRoster}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </div>

          {/* VIEW 1: TOP-LEVEL OVERVIEW (Default view - SelectedClassId is null) */}
          {!selectedClassId ? (
            <div className="space-y-6">
              
              {/* Aggregated School stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                <div className="bg-white border p-5 rounded-2xl shadow-3xs flex items-center gap-4">
                  <div className="w-10 h-10 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center text-teal-750 font-black text-sm">
                    🏫
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Students</p>
                    <p className="text-xl font-black text-slate-800 mt-0.5">{schoolStats.total}</p>
                  </div>
                </div>

                <div className="bg-white border p-5 rounded-2xl shadow-3xs flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-black text-sm">
                    🟢
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Present Today</p>
                    <p className="text-xl font-black text-slate-800 mt-0.5">{schoolStats.present}</p>
                  </div>
                </div>

                <div className="bg-white border p-5 rounded-2xl shadow-3xs flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-700 font-black text-sm">
                    🔴
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Absent Today</p>
                    <p className="text-xl font-black text-slate-800 mt-0.5">{schoolStats.absent}</p>
                  </div>
                </div>

                <div className="bg-white border p-5 rounded-2xl shadow-3xs flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 font-black text-sm">
                    📈
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Attendance Ratio</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xl font-black text-slate-800">{schoolStats.rate}%</p>
                      <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${schoolStats.rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Class Cards Filter & Grid */}
              <div className="bg-white p-5 border rounded-3xl shadow-3xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">Classroom Divisions Overview</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Track records progress by division</p>
                  </div>
                  
                  {/* Class search */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search class sections..."
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Grid of Class Cards */}
                {loadingClasses || loadingSummaries ? (
                  <div className="py-16 text-center text-xs font-bold text-slate-400 space-y-2">
                    <RefreshCw className="w-8 h-8 animate-spin text-teal-800 mx-auto" />
                    <p>Loading school divisions data...</p>
                  </div>
                ) : filteredClasses.length === 0 ? (
                  <div className="py-16 text-center">
                    <FolderOpen className="w-10 h-10 text-slate-350 mx-auto mb-2" />
                    <p className="text-xs font-extrabold text-slate-500">No classes registered</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredClasses.map((cls) => {
                      const summary = classSummaries[cls.id];
                      const totalStudents = cls.students?.length || 0;

                      // Display default states if summary fetch failed
                      const present = summary?.present ?? 0;
                      const absent = summary?.absent ?? 0;
                      const unmarked = summary?.unmarked ?? totalStudents;
                      const rate = summary?.rate ?? 100;
                      const status = summary?.status ?? 'Unmarked';
                      
                      const markedCount = present + absent;
                      const markedPct = totalStudents > 0 ? Math.round((markedCount / totalStudents) * 100) : 0;

                      // Status Badge configuration
                      let statusBadge = 'bg-slate-100 border-slate-200 text-slate-500';
                      if (status === 'Completed') statusBadge = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                      else if (status === 'In Progress') statusBadge = 'bg-amber-50 border-amber-200 text-amber-800';

                      return (
                        <div
                          key={cls.id}
                          onClick={() => setSelectedClassId(cls.id)}
                          className="group relative border border-slate-200/60 p-5 bg-white hover:bg-slate-50/50 hover:shadow-md hover:-translate-y-0.5 rounded-3xl transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                        >
                          {/* Header info */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-black text-slate-800 text-sm">{cls.name}</h4>
                              <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-extrabold uppercase tracking-wide ${statusBadge}`}>
                                {status}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold block">{totalStudents} Enrolled Candidates</span>
                          </div>

                          {/* Stats Grid inside Card */}
                          <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-slate-100 text-[10px] font-bold text-slate-500">
                            <div>
                              <span className="text-slate-400 block uppercase text-[8px] font-extrabold tracking-wider">Present</span>
                              <span className="text-emerald-600 text-xs font-black mt-0.5 block">{present}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block uppercase text-[8px] font-extrabold tracking-wider">Absent</span>
                              <span className="text-rose-600 text-xs font-black mt-0.5 block">{absent}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block uppercase text-[8px] font-extrabold tracking-wider">Unmarked</span>
                              <span className="text-amber-500 text-xs font-black mt-0.5 block">{unmarked}</span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                              <span>Log Progress</span>
                              <span className="text-slate-700">{markedPct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-350"
                                style={{ width: `${markedPct}%` }}
                              />
                            </div>
                          </div>

                          {/* Footer Action */}
                          <div className="pt-2 flex items-center justify-between text-[10px] font-black uppercase text-teal-850 border-t border-slate-50">
                            <span>Manage Roster</span>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            
            // VIEW 2: CLASS ROSTER DRILL-DOWN (SelectedClassId is active)
            <div className="space-y-6">
              
              {/* Back & Title Header */}
              <div className="bg-white border rounded-3xl p-5 shadow-3xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedClassId(null)}
                      className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl transition-all cursor-pointer"
                      title="Back to Class Dashboard"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                        🏫 {selectedClassName} Attendance Registry
                      </h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                        Enrollment size: {activeClassStats.total} • Status Registry Detail
                      </p>
                    </div>
                  </div>

                  {/* Roster actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBulkMark('present')}
                      disabled={loadingRoster || bulkActionLoading || activeClassStats.total === 0}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-[10px] uppercase tracking-wide rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      Mark All Present
                    </button>
                    <button
                      onClick={() => handleBulkMark('absent')}
                      disabled={loadingRoster || bulkActionLoading || activeClassStats.total === 0}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-extrabold text-[10px] uppercase tracking-wide rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      Mark All Absent
                    </button>
                  </div>
                </div>

                {/* Stats Row inside Drilldown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                  <div className="bg-slate-50/50 p-4 border rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Roster Present</span>
                    <div className="text-xl font-black text-emerald-600 mt-1">{activeClassStats.present}</div>
                  </div>
                  <div className="bg-slate-50/50 p-4 border rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Roster Absent</span>
                    <div className="text-xl font-black text-rose-600 mt-1">{activeClassStats.absent}</div>
                  </div>
                  <div className="bg-slate-50/50 p-4 border rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Roster Unmarked</span>
                    <div className="text-xl font-black text-amber-500 mt-1">
                      {activeClassStats.unmarked} {activeClassStats.unmarked > 0 && <span className="text-[10px] animate-pulse">⏳</span>}
                    </div>
                  </div>
                  <div className="bg-slate-50/50 p-4 border rounded-2xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Class Attendance Rate</span>
                    <div className="text-xl font-black text-indigo-600 mt-1">{activeClassStats.rate}%</div>
                  </div>
                </div>
              </div>

              {/* Locked Warning */}
              {activeClassStats.locked > 0 && (
                <div className="bg-amber-500/10 border border-amber-300/40 rounded-2xl p-4 flex items-center gap-3 text-amber-950 text-xs">
                  <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                  <div>
                    <span className="font-extrabold">{activeClassStats.locked} records are locked</span> on this date.
                    {isPrincipalMode ? (
                      <span className="font-semibold ml-1 text-violet-750">Principal access is active. Changes bypass locking rules.</span>
                    ) : (
                      <span className="font-semibold ml-1">Bypassing locks requires administrator key access.</span>
                    )}
                  </div>
                </div>
              )}

              {/* Roster Controls: Search & Tabs */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 border rounded-2xl shadow-3xs">
                
                {/* Search roster */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter student roster..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700/35 transition-all"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center border rounded-xl p-0.5 bg-slate-100/60 w-full sm:w-auto overflow-x-auto">
                  <button
                    onClick={() => setStatusTab('all')}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      statusTab === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({students.length})
                  </button>
                  <button
                    onClick={() => setStatusTab('present')}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      statusTab === 'present' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-emerald-700'
                    }`}
                  >
                    Present ({activeClassStats.present})
                  </button>
                  <button
                    onClick={() => setStatusTab('absent')}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      statusTab === 'absent' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-rose-700'
                    }`}
                  >
                    Absent ({activeClassStats.absent})
                  </button>
                  <button
                    onClick={() => setStatusTab('unmarked')}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      statusTab === 'unmarked' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500 hover:text-amber-600'
                    }`}
                  >
                    Unmarked ({activeClassStats.unmarked})
                  </button>
                </div>

                {/* Page Size */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2.5 py-1.5 border rounded-xl bg-slate-50 text-[10px] font-extrabold text-slate-650 focus:outline-none"
                  >
                    <option value={15}>15 Rows</option>
                    <option value={25}>25 Rows</option>
                    <option value={50}>50 Rows</option>
                    <option value={100}>100 Rows</option>
                  </select>
                </div>
              </div>

              {/* Roster Registry Table */}
              <div className="bg-white border rounded-3xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                        <th className="px-6 py-4">Student Candidate</th>
                        <th className="px-6 py-4">Status Log</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingRoster ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-xs font-bold text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                              <RefreshCw className="w-6 h-6 animate-spin text-teal-800" />
                              <span>Loading roster entries...</span>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedStudents.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-16 text-center">
                            <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-extrabold text-slate-500">No students matching filters</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Try resetting search keywords or active status tabs.</p>
                          </td>
                        </tr>
                      ) : (
                        paginatedStudents.map((student) => {
                          const status = student.attendance?.status;
                          const isUnmarked = !student.attendance;
                          const isLocked = student.attendance?.isLocked ?? false;
                          const disableToggle = isLocked && !isPrincipalMode;

                          const initials = student.name
                            .trim()
                            .split(/\s+/)
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase();

                          return (
                            <tr key={student.id} className="hover:bg-slate-50/50 transition-all text-xs text-slate-700">
                              {/* Student Info */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8.5 h-8.5 rounded-full bg-slate-100 border flex items-center justify-center font-bold text-slate-600 text-[10px] uppercase shrink-0 shadow-inner">
                                    {initials}
                                  </div>
                                  <div>
                                    <h4 className="font-extrabold text-slate-800 leading-snug">{student.name}</h4>
                                    <span className="text-[9px] text-slate-400 mt-0.5 block">{student.email}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Status badge */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {isUnmarked ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-200 bg-amber-500/10 text-amber-700 text-[9px] font-extrabold uppercase tracking-wide">
                                      Unmarked
                                    </span>
                                  ) : (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wide ${
                                        status === 'present'
                                          ? 'bg-emerald-500/10 border-emerald-250 text-emerald-700'
                                          : 'bg-rose-500/10 border-rose-250 text-rose-700'
                                      }`}
                                    >
                                      {status === 'present' ? 'Present' : 'Absent'}
                                    </span>
                                  )}

                                  {isLocked && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-450 bg-slate-100/80 border px-1.5 py-0.5 rounded-md">
                                      <Lock className="w-3 h-3 text-slate-400" /> Locked
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Action Segmented Controls */}
                              <td className="px-6 py-4 text-right">
                                <div className="inline-flex rounded-xl border border-slate-200/60 p-0.5 bg-slate-100/50 shadow-inner">
                                  <button
                                    onClick={() => handleSetStatus(student, 'present')}
                                    disabled={disableToggle}
                                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 ${
                                      status === 'present'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    Present
                                  </button>
                                  <button
                                    onClick={() => handleSetStatus(student, 'absent')}
                                    disabled={disableToggle}
                                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 ${
                                      status === 'absent'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                  >
                                    Absent
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION CONTROLS */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide">
                      Showing {Math.min((currentPage - 1) * pageSize + 1, filteredStudents.length)} to{' '}
                      {Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length}{' '}
                      students
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 border rounded-xl hover:bg-white text-slate-650 cursor-pointer transition-colors disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        const isCurrent = currentPage === pageNum;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-xl font-bold text-xs cursor-pointer transition-all border ${
                              isCurrent
                                ? 'bg-teal-950 text-white border-teal-950 shadow-xs'
                                : 'hover:bg-white text-slate-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 border rounded-xl hover:bg-white text-slate-650 cursor-pointer transition-colors disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
