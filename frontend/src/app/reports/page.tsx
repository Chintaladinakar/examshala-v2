'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import { 
  Search, 
  ArrowLeft, 
  RefreshCw, 
  BarChart2, 
  Calendar, 
  FileText, 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Eye, 
  MessageSquare,
  GraduationCap,
  Users,
  ChevronRight,
  BookOpen,
  TrendingUp,
  Sliders,
  ChevronLeft
} from 'lucide-react';

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface StudentLite {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  class: { id: string; name: string } | null;
  avgScore: number;
  attendanceRate: number;
}

interface TutorLite {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  classes: { id: string; name: string }[];
  attendanceRate: number;
}

interface WorkspaceStats {
  totalStudents: number;
  totalTutors: number;
  activeStudents: number;
  avgWorkspaceAttendance: number;
  avgTutorAttendance: number;
  avgWorkspaceScore: number;
}

interface SummaryData {
  isSummary: true;
  students: StudentLite[];
  tutors: TutorLite[];
  stats: WorkspaceStats;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent';
  Class: { name: string };
}

interface AssignmentSubmission {
  id: string;
  fileUrl: string;
  submittedAt: string;
}

interface AssignmentFeedback {
  id: string;
  comment: string;
  createdAt: string;
  Creator?: { name: string };
}

interface AssignmentRecord {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  Class: { name: string };
  submissions: AssignmentSubmission[];
  feedbacks: AssignmentFeedback[];
}

interface ExamResult {
  id: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  rank: number | null;
  status: string;
  feedback: string | null;
  createdAt: string;
}

interface VirtualAttempt {
  id: string;
  focusLoss: number;
  startedAt: string;
  submittedAt: string | null;
  status: string;
  Assignment: {
    Test: { title: string };
  };
  Result: {
    score: number;
    maxScore: number;
    evaluatedAt: string;
    feedback: string | null;
  } | null;
}

interface StudentReport {
  isSummary: false;
  isTutor: false;
  student: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  classes: { id: string; name: string }[];
  attendance: AttendanceRecord[];
  results: ExamResult[];
  attempts: VirtualAttempt[];
}

interface TutorReport {
  isSummary: false;
  isTutor: true;
  tutor: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  classes: { id: string; name: string }[];
  attendance: AttendanceRecord[];
  classResults: ExamResult[];
}

// Union Report Response type
type ReportData = StudentReport | TutorReport;

interface ClassRecord {
  id: string;
  name: string;
  students: { Student: { id: string; name: string; email: string } }[];
}

export default function ReportsPage() {
  const { user } = useUser();
  const { showError } = useToast();

  const role = (user?.role || '').toLowerCase();
  const isStudent = role === 'student';
  const isTutor = role === 'tutor' || role === 'teacher';
  const isPrincipal = role === 'principal';
  const isTeacherOrPrincipal = isTutor || isPrincipal;

  // State
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  // Directories & selectors
  const [directoryMode, setDirectoryMode] = useState<'students' | 'tutors'>('students');
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedTutorId, setSelectedTutorId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Search bar for either student or tutor
  const [searchUserQuery, setSearchUserQuery] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Tabs & interaction
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'exams' | 'classPerformance'>('overview');
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);

  // Load Classes list for selectors
  async function loadClasses() {
    if (!isTeacherOrPrincipal) return;
    try {
      const res = await fetch('/api/classes');
      const body = await res.json();
      if (body?.success && Array.isArray(body.data)) {
        setClasses(body.data);
      }
    } catch (e) {
      console.error('Failed to load classes', e);
    }
  }

  // Load Workspace level summary or Student direct report
  async function loadInitialData() {
    try {
      setLoadingSummary(true);
      const res = await fetch('/api/reports');
      const body = await res.json();
      if (body?.success) {
        if (body.data.isSummary) {
          setSummaryData(body.data);
          setReportData(null);
        } else {
          setReportData(body.data);
          setSummaryData(null);
        }
      } else {
        throw new Error(body?.error?.message || 'Failed to fetch reports directory data');
      }
    } catch (e) {
      showError(e);
    } finally {
      setLoadingSummary(false);
    }
  }

  // Load Report for a specific user (student or tutor)
  async function loadReport(userId: string) {
    if (!userId) {
      setReportData(null);
      return;
    }
    try {
      setLoadingReport(true);
      const res = await fetch(`/api/reports?studentId=${userId}`);
      const body = await res.json();
      if (body?.success) {
        setReportData(body.data);
        setActiveTab('overview');
      } else {
        throw new Error(body?.error?.message || 'Failed to fetch detailed report card');
      }
    } catch (e) {
      showError(e);
    } finally {
      setLoadingReport(false);
    }
  }

  useEffect(() => {
    loadClasses();
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const searchSuggestions = useMemo(() => {
    if (!searchUserQuery.trim() || !summaryData) return [];
    const query = searchUserQuery.toLowerCase();

    const studentMatches = (summaryData.students || [])
      .filter(s => s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query))
      .map(s => ({ id: s.id, name: s.name, email: s.email, type: 'student' }));

    const tutorMatches = (summaryData.tutors || [])
      .filter(t => t.name.toLowerCase().includes(query) || t.email.toLowerCase().includes(query))
      .map(t => ({ id: t.id, name: t.name, email: t.email, type: 'tutor' }));

    return [...studentMatches, ...tutorMatches].slice(0, 10);
  }, [searchUserQuery, summaryData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Derived student list for dropdown/table depending on selected class
  const classFilteredStudents = useMemo(() => {
    if (!summaryData) return [];
    if (!selectedClassId) return summaryData.students;
    return summaryData.students.filter(s => s.class?.id === selectedClassId);
  }, [summaryData, selectedClassId]);

  // Search filtered student list
  const searchFilteredStudents = useMemo(() => {
    const list = classFilteredStudents;
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(s => s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query));
  }, [classFilteredStudents, searchQuery]);

  // Search filtered tutor list
  const searchFilteredTutors = useMemo(() => {
    if (!summaryData) return [];
    const list = summaryData.tutors;
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(t => t.name.toLowerCase().includes(query) || t.email.toLowerCase().includes(query));
  }, [summaryData, searchQuery]);

  // Get active student dropdown selection list
  const dropdownStudents = useMemo(() => {
    if (!selectedClassId) {
      return summaryData?.students || [];
    }
    const cls = classes.find(c => c.id === selectedClassId);
    if (!cls) return [];
    return cls.students.map(s => ({
      id: s.Student.id,
      name: s.Student.name,
      email: s.Student.email
    }));
  }, [classes, selectedClassId, summaryData]);

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    setSelectedTutorId('');
    if (studentId) {
      const student = summaryData?.students.find(s => s.id === studentId);
      if (student) setSearchUserQuery(student.name);
      loadReport(studentId);
    } else {
      setSearchUserQuery('');
      setReportData(null);
    }
  };

  const handleTutorSelect = (tutorId: string) => {
    setSelectedTutorId(tutorId);
    setSelectedStudentId('');
    if (tutorId) {
      const tutor = summaryData?.tutors.find(t => t.id === tutorId);
      if (tutor) setSearchUserQuery(tutor.name);
      loadReport(tutorId);
    } else {
      setSearchUserQuery('');
      setReportData(null);
    }
  };

  const clearSelection = () => {
    setSelectedStudentId('');
    setSelectedTutorId('');
    setSearchUserQuery('');
    setReportData(null);
  };

  // ─── Stat Calculations ───────────────────────────────────────────────────────
  
  const stats = useMemo(() => {
    if (!reportData) return { attendanceRate: 100, avgScore: 0 };
    
    // Tutor Attendance vs Student Attendance
    const totalAtt = reportData.attendance.length;
    const presentAtt = reportData.attendance.filter(a => a.status === 'present').length;
    const attendanceRate = totalAtt ? Math.round((presentAtt / totalAtt) * 100) : 100;

    if (reportData.isTutor) {
      const tutorData = reportData as TutorReport;
      
      const classScores = tutorData.classResults;
      const avgClassScore = classScores.length 
        ? Math.round(classScores.reduce((acc, r) => acc + r.percentage, 0) / classScores.length * 10) / 10 
        : 0;

      return {
        attendanceRate,
        avgScore: avgClassScore
      };
    } else {
      const studentData = reportData as StudentReport;

      // Average Exam Score
      const examResults = studentData.results;
      const avgScore = examResults.length 
        ? Math.round(examResults.reduce((acc, r) => acc + r.percentage, 0) / examResults.length * 10) / 10 
        : 0;

      return {
        attendanceRate,
        avgScore
      };
    }
  }, [reportData]);

  // Chronological scores for SVG line chart
  const chronologicalResults = useMemo(() => {
    if (!reportData) return [];
    if (reportData.isTutor) {
      const tutorData = reportData as TutorReport;
      if (!tutorData.classResults.length) return [];
      return [...tutorData.classResults].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      const studentData = reportData as StudentReport;
      if (!studentData.results.length) return [];
      return [...studentData.results].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  }, [reportData]);

  // SVG Chart Coordinates Builder
  const chartPathData = useMemo(() => {
    if (chronologicalResults.length < 2) return '';
    const width = 500;
    const height = 150;
    const padding = 25;
    
    const points = chronologicalResults.map((r, i) => {
      const x = padding + (i * (width - 2 * padding)) / (chronologicalResults.length - 1);
      const y = height - padding - ((r.percentage / 100) * (height - 2 * padding));
      return { x, y };
    });

    return points.map(p => `${p.x},${p.y}`).join(' ');
  }, [chronologicalResults]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar />
      
      <main className="flex-1 min-w-0 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* ─── HEADER ─── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-6 h-6 text-emerald-600" />
                <h1 className="text-2xl font-black tracking-tight text-slate-800">SaaS Reports Hub</h1>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {isStudent 
                  ? 'Monitor your real-time attendance, assignment logs, and grades' 
                  : 'Analyze school performance, track tutor check-ins, and view student transcripts'}
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-start md:self-auto">
              {isTutor && !reportData && (
                <button
                  onClick={() => loadReport(user?.id || '')}
                  className="px-4 py-2.5 rounded-xl bg-teal-950 hover:bg-teal-900 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  View My Tutor Report
                </button>
              )}
              
              <button 
                onClick={() => {
                  if (reportData?.isTutor) {
                    loadReport((reportData as TutorReport).tutor.id);
                  } else if (reportData) {
                    loadReport((reportData as StudentReport).student.id);
                  } else {
                    loadInitialData();
                    loadClasses();
                  }
                }}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm text-slate-600 hover:text-slate-900 flex items-center gap-1.5 text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </div>

          {/* ─── TOOLBAR SELECTORS (FOR TUTORS / PRINCIPALS) ─── */}
          {isTeacherOrPrincipal && (
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
              <div className="w-full md:flex-1 relative" ref={searchContainerRef}>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                  Search Student or Tutor
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidate name or email..."
                    value={searchUserQuery}
                    onChange={(e) => {
                      setSearchUserQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                  {searchUserQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchUserQuery('');
                        clearSelection();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 text-xs font-bold p-0.5 rounded-full hover:bg-slate-200"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
                    {searchSuggestions.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => {
                          setSearchUserQuery(candidate.name);
                          setShowSuggestions(false);
                          if (candidate.type === 'student') {
                            handleStudentSelect(candidate.id);
                          } else {
                            handleTutorSelect(candidate.id);
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800">{candidate.name}</div>
                          <div className="text-[10px] text-slate-400">{candidate.email}</div>
                        </div>
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          candidate.type === 'student' ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-indigo-50 text-indigo-750 border border-indigo-100'
                        }`}>
                          {candidate.type}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-full md:w-56">
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                  Class Filter
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setSelectedStudentId('');
                    setSelectedTutorId('');
                    setReportData(null);
                  }}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
                >
                  <option value="">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-64">
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                  Student Transcripts
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
                >
                  <option value="">-- View Summary Overview --</option>
                  {dropdownStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>

              {isPrincipal && (
                <div className="w-full md:w-64">
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                    Tutor Attendance & Reports
                  </label>
                  <select
                    value={selectedTutorId}
                    onChange={(e) => handleTutorSelect(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
                  >
                    <option value="">-- Tutor Directory Overview --</option>
                    {summaryData?.tutors.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (Tutor)</option>
                    ))}
                  </select>
                </div>
              )}

              {reportData && (
                <button
                  onClick={clearSelection}
                  className="w-full md:w-auto px-4 py-2.5 mt-4 md:mt-5 text-xs font-bold text-emerald-600 bg-emerald-55/10 hover:bg-emerald-55/20 transition rounded-xl flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Directory
                </button>
              )}
            </div>
          )}

          {/* ─── LOADING STATE ─── */}
          {(loadingSummary || loadingReport) && (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm select-none animate-pulse">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">Retrieving aggregated analytical files...</p>
            </div>
          )}

          {/* ─── MAIN CONTENT ─── */}
          {!(loadingSummary || loadingReport) && (
            <>
              {/* SECTION A: WORKSPACE SUMMARY & DIRECTORIES (FOR TEACHERS/PRINCIPALS) */}
              {!reportData && summaryData && isTeacherOrPrincipal && (
                <div className="space-y-6">
                  
                  {/* Stats Summary Dashboard */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Students</p>
                          <h3 className="text-3xl font-black text-slate-800 mt-1">{summaryData.stats.totalStudents}</h3>
                          <span className="text-[10px] text-slate-450 font-semibold">{summaryData.stats.activeStudents} active profiles</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-teal-55/10 text-teal-700 flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Tutors & Faculty</p>
                          <h3 className="text-3xl font-black text-slate-800 mt-1">{summaryData.stats.totalTutors}</h3>
                          <span className="text-[10px] text-slate-450 font-semibold">Tutor Check-In Active</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-indigo-55/10 text-indigo-750 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Student Attendance Avg</p>
                          <h3 className="text-3xl font-black text-slate-800 mt-1">{summaryData.stats.avgWorkspaceAttendance}%</h3>
                          <span className="text-[10px] text-emerald-600 font-bold">🟢 High Attendance</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-55/10 text-emerald-700 flex items-center justify-center">
                          <Calendar className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {isPrincipal ? (
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Tutor Attendance Avg</p>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{summaryData.stats.avgTutorAttendance}%</h3>
                            <span className="text-[10px] text-teal-600 font-bold">🟢 Faculty Engagement</span>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-teal-55/10 text-teal-700 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Workspace Grade Avg</p>
                            <h3 className="text-3xl font-black text-slate-800 mt-1">{summaryData.stats.avgWorkspaceScore}%</h3>
                            <span className="text-[10px] text-teal-600 font-bold">Grade B+ Average</span>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-teal-55/10 text-teal-700 flex items-center justify-center">
                            <Award className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Toggle Mode Tab (Principal Only) */}
                  {isPrincipal && (
                    <div className="flex border-b border-slate-200">
                      <button
                        onClick={() => { setDirectoryMode('students'); setSearchQuery(''); }}
                        className={`px-5 py-3 font-extrabold text-xs uppercase tracking-wider transition-all border-b-2 leading-none flex items-center gap-1.5 ${
                          directoryMode === 'students' 
                            ? 'border-emerald-600 text-emerald-650 font-black' 
                            : 'border-transparent text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Student Directory Reports
                      </button>
                      <button
                        onClick={() => { setDirectoryMode('tutors'); setSearchQuery(''); }}
                        className={`px-5 py-3 font-extrabold text-xs uppercase tracking-wider transition-all border-b-2 leading-none flex items-center gap-1.5 ${
                          directoryMode === 'tutors' 
                            ? 'border-emerald-600 text-emerald-650 font-black' 
                            : 'border-transparent text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        Tutor Attendance & Reports
                      </button>
                    </div>
                  )}

                  {/* Directory View */}
                  {directoryMode === 'students' ? (
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h2 className="font-bold text-slate-800 text-base">Student Roster Transcripts</h2>
                          <p className="text-xs text-slate-400 mt-0.5">Filter by class dropdown or search by name below</p>
                        </div>
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                              <th className="py-4 px-6">Name</th>
                              <th className="py-4 px-6">Class Assignment</th>
                              <th className="py-4 px-6">Attendance Rate</th>
                              <th className="py-4 px-6">Average Exam Score</th>
                              <th className="py-4 px-6">Status</th>
                              <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {searchFilteredStudents.length > 0 ? (
                              searchFilteredStudents.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition">
                                  <td className="py-4 px-6 font-bold text-slate-800">
                                    <div>{s.name}</div>
                                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">{s.email}</div>
                                  </td>
                                  <td className="py-4 px-6 font-semibold text-slate-650">
                                    {s.class?.name || <span className="text-slate-400 italic font-normal">Unassigned</span>}
                                  </td>
                                  <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full ${s.attendanceRate >= 90 ? 'bg-emerald-500' : s.attendanceRate >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                          style={{ width: `${s.attendanceRate}%` }}
                                        />
                                      </div>
                                      <span className="font-extrabold text-slate-700">{s.attendanceRate}%</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                      s.avgScore >= 85 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                      s.avgScore >= 70 ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                      'bg-rose-50 text-rose-700 border border-rose-100'
                                    }`}>
                                      {s.avgScore}%
                                    </span>
                                  </td>
                                  <td className="py-4 px-6">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${s.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                      {s.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                    <button
                                      onClick={() => handleStudentSelect(s.id)}
                                      className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 text-slate-500 hover:text-emerald-600 hover:bg-emerald-55/10 transition duration-150 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      Analyze Student
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="py-8 px-6 text-center text-slate-400 font-semibold">
                                  No students match your active filters or search terms.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    // Tutor Directory View (Principal Only)
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h2 className="font-bold text-slate-800 text-base">Tutor Attendance & Performance</h2>
                          <p className="text-xs text-slate-400 mt-0.5">Track faculty check-ins and course materials metrics</p>
                        </div>
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search tutors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                              <th className="py-4 px-6">Tutor Name</th>
                              <th className="py-4 px-6">Assigned Divisions</th>
                              <th className="py-4 px-6">Tutor Attendance Rate</th>
                              <th className="py-4 px-6">Status</th>
                              <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {searchFilteredTutors.length > 0 ? (
                              searchFilteredTutors.map((t) => (
                                <tr key={t.id} className="hover:bg-slate-50/50 transition">
                                  <td className="py-4 px-6 font-bold text-slate-800">
                                    <div>{t.name}</div>
                                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">{t.email}</div>
                                  </td>
                                  <td className="py-4 px-6 font-semibold text-slate-600">
                                    {t.classes.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {t.classes.map(c => (
                                          <span key={c.id} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px]">
                                            {c.name}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic">No classes assigned</span>
                                    )}
                                  </td>
                                  <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full ${t.attendanceRate >= 95 ? 'bg-emerald-500' : t.attendanceRate >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                          style={{ width: `${t.attendanceRate}%` }}
                                        />
                                      </div>
                                      <span className="font-extrabold text-slate-750">{t.attendanceRate}%</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${t.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                      {t.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                    <button
                                      onClick={() => handleTutorSelect(t.id)}
                                      className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 text-slate-500 hover:text-emerald-600 hover:bg-emerald-55/10 transition duration-150 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      Analyze Tutor
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="py-8 px-6 text-center text-slate-400 font-semibold">
                                  No tutors match your search terms in this workspace.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* SECTION B: DETAILED REPORT CARD (STUDENT OR TUTOR) */}
              {reportData && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* PROFILE BANNER CARD */}
                  {reportData.isTutor ? (
                    // Tutor Profile Banner
                    <div className="bg-gradient-to-r from-teal-950 to-emerald-950 text-white rounded-3xl p-6 shadow-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center font-black text-emerald-400 text-xl border border-white/10">
                          {(reportData as TutorReport).tutor.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black tracking-tight">{(reportData as TutorReport).tutor.name}</h2>
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500 text-white">Tutor</span>
                          </div>
                          <p className="text-xs text-emerald-300/80 mt-0.5">{(reportData as TutorReport).tutor.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {reportData.classes.map(c => (
                              <span key={c.id} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white/90 border border-white/5">
                                🏫 {c.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Quick KPIs */}
                      <div className="flex gap-4 md:gap-8 self-start sm:self-auto border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0 w-full sm:w-auto justify-around sm:justify-start">
                        <div className="text-center">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-300/60 block">Check-In Attendance</span>
                          <span className="text-xl font-extrabold block mt-0.5">{stats.attendanceRate}%</span>
                        </div>
                        <div className="w-px bg-white/10 h-8 self-center" />
                        <div className="text-center">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-300/60 block">Class Avg Performance</span>
                          <span className="text-xl font-extrabold text-emerald-400 block mt-0.5">{stats.avgScore}%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Student Profile Banner
                    <div className="bg-gradient-to-r from-teal-950 to-emerald-950 text-white rounded-3xl p-6 shadow-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center font-black text-emerald-400 text-xl border border-white/10">
                          {(reportData as StudentReport).student.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-xl font-black tracking-tight">{(reportData as StudentReport).student.name}</h2>
                          <p className="text-xs text-emerald-300/80 mt-0.5">{(reportData as StudentReport).student.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {reportData.classes.map(c => (
                              <span key={c.id} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white/90 border border-white/5">
                                🏫 {c.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Quick KPIs */}
                      <div className="flex gap-4 md:gap-8 self-start sm:self-auto border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0 w-full sm:w-auto justify-around sm:justify-start">
                        <div className="text-center">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-300/60 block">Attendance</span>
                          <span className="text-xl font-extrabold block mt-0.5">{stats.attendanceRate}%</span>
                        </div>
                        <div className="w-px bg-white/10 h-8 self-center" />
                        <div className="text-center">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-300/60 block">Exam Avg</span>
                          <span className="text-xl font-extrabold text-emerald-400 block mt-0.5">{stats.avgScore}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TABS SELECT NAVIGATION */}
                  {reportData.isTutor ? (
                    // Tutor tabs
                    <div className="flex border-b border-slate-200 gap-1.5 overflow-x-auto pb-px">
                      <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 leading-none whitespace-nowrap ${
                          activeTab === 'overview' 
                            ? 'border-emerald-600 text-emerald-650 font-extrabold' 
                            : 'border-transparent text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => setActiveTab('attendance')}
                        className={`px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 leading-none whitespace-nowrap ${
                          activeTab === 'attendance' 
                            ? 'border-emerald-600 text-emerald-650 font-extrabold' 
                            : 'border-transparent text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        Tutor Check-Ins Ledger
                      </button>
                      <button
                        onClick={() => setActiveTab('classPerformance')}
                        className={`px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 leading-none whitespace-nowrap ${
                          activeTab === 'classPerformance' 
                            ? 'border-emerald-600 text-emerald-650 font-extrabold' 
                            : 'border-transparent text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        Classroom Performance Curve
                      </button>
                    </div>
                  ) : (
                    // Student tabs
                    <div className="flex border-b border-slate-200 gap-1.5 overflow-x-auto pb-px">
                      <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 leading-none whitespace-nowrap ${
                          activeTab === 'overview' 
                            ? 'border-emerald-600 text-emerald-650 font-extrabold' 
                            : 'border-transparent text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        Overview & Trends
                      </button>
                      <button
                        onClick={() => setActiveTab('attendance')}
                        className={`px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 leading-none whitespace-nowrap ${
                          activeTab === 'attendance' 
                            ? 'border-emerald-600 text-emerald-650 font-extrabold' 
                            : 'border-transparent text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        Attendance Ledger
                      </button>
                      <button
                        onClick={() => setActiveTab('exams')}
                        className={`px-4 py-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 leading-none whitespace-nowrap ${
                          activeTab === 'exams' 
                            ? 'border-emerald-600 text-emerald-650 font-extrabold' 
                            : 'border-transparent text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        Exam Transcripts ({(reportData as StudentReport).results.length})
                      </button>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      TUTOR SPECIFIC TABS RENDER 
                     ───────────────────────────────────────────────────────────── */}
                  
                  {/* TUTOR OVERVIEW TAB */}
                  {reportData.isTutor && activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* highlights */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm">Faculty Metrics Summary</h3>
                        
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                            <CheckCircle2 className="w-5 h-5 text-emerald-650 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-slate-850 text-xs font-black">Check-In Rating</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Tutor check-in rate is {stats.attendanceRate}%. Consistent class conduction helps maintain workspace syllabus targets.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                            <GraduationCap className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-slate-850 text-xs font-black">Division Assignments</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Assigned to {reportData.classes.length} divisions: {reportData.classes.map(c => c.name).join(', ') || 'None'}.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tutor classes lists */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm lg:col-span-2 space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm">Assigned Classes</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {reportData.classes.map(c => (
                            <div key={c.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/20">
                              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Class Section</span>
                              <h4 className="font-extrabold text-slate-800 text-sm mt-0.5">🏫 {c.name}</h4>
                            </div>
                          ))}
                          {reportData.classes.length === 0 && (
                            <div className="col-span-2 text-center text-slate-400 text-xs py-8">
                              No classes mapped to this tutor profile.
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TUTOR ATTENDANCE LEDGER */}
                  {reportData.isTutor && activeTab === 'attendance' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* progress circle */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Check-In Status Rate</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Tutor check-in attendance metric</p>
                        </div>

                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                              <circle 
                                cx="50" 
                                cy="50" 
                                r="40" 
                                stroke="#10b981" 
                                strokeWidth="8" 
                                fill="transparent" 
                                strokeDasharray={2 * Math.PI * 40}
                                strokeDashoffset={2 * Math.PI * 40 * (1 - stats.attendanceRate / 100)}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute text-2xl font-black text-slate-800">{stats.attendanceRate}%</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center border-t border-slate-100 pt-4">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Check-Ins Present</span>
                            <span className="text-base font-bold text-emerald-600 mt-1 block">
                              {reportData.attendance.filter(a => a.status === 'present').length} days
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Absences logged</span>
                            <span className="text-base font-bold text-rose-600 mt-1 block">
                              {reportData.attendance.filter(a => a.status === 'absent').length} days
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed records */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm lg:col-span-2 space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm">Faculty Check-In Ledger</h3>
                        
                        <div className="overflow-hidden border border-slate-150 rounded-2xl">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Class Session/Reference</th>
                                <th className="py-3 px-4">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {reportData.attendance.map((a) => (
                                <tr key={a.id} className="hover:bg-slate-50/50 transition">
                                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                                    {new Date(a.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-650 font-medium">{a.Class.name}</td>
                                  <td className="py-3.5 px-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      a.status === 'present' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                    }`}>
                                      {a.status === 'present' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                                      {a.status.toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  )}



                  {/* TUTOR CLASS PERFORMANCE TAB (SVG TREND GRAPH FOR TUTORS) */}
                  {reportData.isTutor && activeTab === 'classPerformance' && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Classroom Results Curve</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Aggregated grade percentage results for classes taught by this tutor</p>
                      </div>

                      {chronologicalResults.length >= 2 ? (
                        <div className="relative pt-4 max-w-2xl mx-auto">
                          {hoveredChartIndex !== null && chronologicalResults[hoveredChartIndex] && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-md z-10 text-center">
                              <div>{chronologicalResults[hoveredChartIndex].subject}</div>
                              <div className="text-emerald-400 mt-0.5">{chronologicalResults[hoveredChartIndex].percentage}% ({chronologicalResults[hoveredChartIndex].grade})</div>
                            </div>
                          )}

                          <svg viewBox="0 0 500 150" className="w-full overflow-visible select-none">
                            {[0, 25, 50, 75, 100].map((grid, idx) => {
                              const y = 150 - 25 - ((grid / 100) * 100);
                              return (
                                <g key={idx}>
                                  <line x1="20" y1={y} x2="480" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                                  <text x="5" y={y + 3} className="fill-slate-400 font-semibold text-[8px]">{grid}%</text>
                                </g>
                              );
                            })}
                            
                            <polyline
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={chartPathData}
                            />
                            
                            {chronologicalResults.map((r, i) => {
                              const x = 25 + (i * 450) / (chronologicalResults.length - 1);
                              const y = 150 - 25 - ((r.percentage / 100) * 100);
                              return (
                                <circle
                                  key={r.id}
                                  cx={x}
                                  cy={y}
                                  r={hoveredChartIndex === i ? '6' : '4'}
                                  className="fill-white stroke-emerald-600 stroke-2 cursor-pointer transition-all duration-150"
                                  onMouseEnter={() => setHoveredChartIndex(i)}
                                  onMouseLeave={() => setHoveredChartIndex(null)}
                                />
                              );
                            })}
                          </svg>
                          
                          <div className="flex justify-between text-[8px] font-extrabold uppercase tracking-wider text-slate-400 px-6 pt-2">
                            <span>Timeline Start</span>
                            <span>Class Performance Aggregated</span>
                            <span>Timeline Latest</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border rounded-2xl p-10 text-center text-xs text-slate-400">
                          Insufficient exam results in classes taught to generate trend curve.
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      STUDENT SPECIFIC TABS RENDER
                     ───────────────────────────────────────────────────────────── */}
                  
                  {/* STUDENT OVERVIEW TAB */}
                  {!reportData.isTutor && activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Line Chart */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm lg:col-span-2 space-y-4">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Academic Performance Curve</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Chronological assessment trends (percentages)</p>
                        </div>

                        {chronologicalResults.length >= 2 ? (
                          <div className="relative pt-4">
                            {hoveredChartIndex !== null && chronologicalResults[hoveredChartIndex] && (
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-md z-10 text-center">
                                <div>{chronologicalResults[hoveredChartIndex].subject}</div>
                                <div className="text-emerald-400 mt-0.5">{chronologicalResults[hoveredChartIndex].percentage}% ({chronologicalResults[hoveredChartIndex].grade})</div>
                              </div>
                            )}

                            <svg viewBox="0 0 500 150" className="w-full overflow-visible select-none">
                              {[0, 25, 50, 75, 100].map((grid, idx) => {
                                const y = 150 - 25 - ((grid / 100) * 100);
                                return (
                                  <g key={idx}>
                                    <line x1="20" y1={y} x2="480" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                                    <text x="5" y={y + 3} className="fill-slate-400 font-semibold text-[8px]">{grid}%</text>
                                  </g>
                                );
                              })}
                              
                              <polyline
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={chartPathData}
                              />
                              
                              {chronologicalResults.map((r, i) => {
                                const x = 25 + (i * 450) / (chronologicalResults.length - 1);
                                const y = 150 - 25 - ((r.percentage / 100) * 100);
                                return (
                                  <circle
                                    key={r.id}
                                    cx={x}
                                    cy={y}
                                    r={hoveredChartIndex === i ? '6' : '4'}
                                    className="fill-white stroke-emerald-600 stroke-2 cursor-pointer transition-all duration-150"
                                    onMouseEnter={() => setHoveredChartIndex(i)}
                                    onMouseLeave={() => setHoveredChartIndex(null)}
                                  />
                                );
                              })}
                            </svg>
                            
                            <div className="flex justify-between text-[8px] font-extrabold uppercase tracking-wider text-slate-400 px-6 pt-2">
                              <span>{new Date(chronologicalResults[0].createdAt).toLocaleDateString()}</span>
                              <span>Timeline Chronological</span>
                              <span>{new Date(chronologicalResults[chronologicalResults.length - 1].createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-50 border rounded-2xl p-10 text-center text-xs text-slate-400">
                            Insufficient assessment entries to generate trend curve.
                          </div>
                        )}
                      </div>

                      {/* Highlights */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm">Report Highlights</h3>
                        
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-slate-800 text-xs">Engagement Status</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {stats.attendanceRate >= 90 
                                  ? `Excellent attendance at ${stats.attendanceRate}%. Consistent attendance correlates with success.` 
                                  : `Attendance is at ${stats.attendanceRate}%. Try to keep active participation.`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                            <Award className="w-5 h-5 text-indigo-650 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-slate-800 text-xs">Virtual Assessment Focus</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Across online tests, averaged focus losses per attempt is {' '}
                                {(reportData as StudentReport).attempts.length 
                                  ? ((reportData as StudentReport).attempts.reduce((acc, a) => acc + a.focusLoss, 0) / (reportData as StudentReport).attempts.length).toFixed(1)
                                  : 0}
                                . Keep exam tab active.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Activity Log */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm lg:col-span-3 space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm">Recent Ledger Activity</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {[
                            ...reportData.attendance.slice(0, 3).map(a => ({ type: 'attendance' as const, date: a.date, data: a })),
                            ...((reportData as StudentReport).results.slice(0, 3).map(r => ({ type: 'result' as const, date: r.createdAt, data: r })))
                          ]
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((act, index) => {
                              const dateStr = act.date;
                              if (act.type === 'attendance') {
                                const att = act.data as AttendanceRecord;
                                return (
                                  <div key={index} className="flex gap-4 border-b border-slate-50 pb-3 last:border-b-0 last:pb-0 text-xs">
                                    <div className="text-slate-400 font-semibold w-24 shrink-0">
                                      {new Date(dateStr).toLocaleDateString()}
                                    </div>
                                    <div className="flex-1">
                                      Marked <strong className={att.status === 'present' ? 'text-emerald-600' : 'text-rose-600'}>{att.status}</strong> in class <strong>{att.Class.name}</strong>.
                                    </div>
                                  </div>
                                );
                              }
                              const res = act.data as ExamResult;
                              return (
                                <div key={index} className="flex gap-4 border-b border-slate-50 pb-3 last:border-b-0 last:pb-0 text-xs">
                                  <div className="text-slate-400 font-semibold w-24 shrink-0">
                                    {new Date(dateStr).toLocaleDateString()}
                                  </div>
                                  <div className="flex-1">
                                    Achieved score of <strong>{res.score}/{res.totalMarks} ({res.percentage}%)</strong> in subject <strong>{res.subject}</strong>.
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STUDENT ATTENDANCE LEDGER */}
                  {!reportData.isTutor && activeTab === 'attendance' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Attendance Summary</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Real-time attendance tracking metric</p>
                        </div>

                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                              <circle 
                                cx="50" 
                                cy="50" 
                                r="40" 
                                stroke="#10b981" 
                                strokeWidth="8" 
                                fill="transparent" 
                                strokeDasharray={2 * Math.PI * 40}
                                strokeDashoffset={2 * Math.PI * 40 * (1 - stats.attendanceRate / 100)}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute text-2xl font-black text-slate-800">{stats.attendanceRate}%</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center border-t border-slate-100 pt-4">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Days Present</span>
                            <span className="text-base font-bold text-emerald-600 mt-1 block">
                              {reportData.attendance.filter(a => a.status === 'present').length} days
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Days Absent</span>
                            <span className="text-base font-bold text-rose-600 mt-1 block">
                              {reportData.attendance.filter(a => a.status === 'absent').length} days
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm lg:col-span-2 space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm">Attendance Records Log</h3>
                        <div className="overflow-hidden border border-slate-150 rounded-2xl">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Class</th>
                                <th className="py-3 px-4">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {reportData.attendance.map((a) => (
                                <tr key={a.id} className="hover:bg-slate-50/50 transition">
                                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                                    {new Date(a.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-600 font-medium">{a.Class.name}</td>
                                  <td className="py-3.5 px-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      a.status === 'present' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                    }`}>
                                      {a.status === 'present' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                                      {a.status.toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}



                  {/* STUDENT EXAM TRANSCRIPTS */}
                  {!reportData.isTutor && activeTab === 'exams' && (
                    <div className="space-y-6">
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm">Academic Results</h3>
                        <div className="overflow-hidden border border-slate-150 rounded-2xl">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">
                                <th className="py-3 px-4">Subject</th>
                                <th className="py-3 px-4">Score Achieved</th>
                                <th className="py-3 px-4">Percentage</th>
                                <th className="py-3 px-4">Grade</th>
                                <th className="py-3 px-4">Class Rank</th>
                                <th className="py-3 px-4">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(reportData as StudentReport).results.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50/50 transition">
                                  <td className="py-4 px-4 font-bold text-slate-800">
                                    {r.subject}
                                    {r.feedback && (
                                      <div className="text-[10px] text-slate-400 font-normal mt-0.5 italic">
                                        ✏️ &ldquo;{r.feedback}&rdquo;
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-4 px-4 font-semibold text-slate-700">{r.score} / {r.totalMarks}</td>
                                  <td className="py-4 px-4 font-extrabold text-slate-800">{r.percentage}%</td>
                                  <td className="py-4 px-4">
                                    <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                                      r.grade.startsWith('A') ? 'bg-emerald-50 text-emerald-700' :
                                      r.grade.startsWith('B') ? 'bg-teal-50 text-teal-700' :
                                      r.grade.startsWith('C') ? 'bg-amber-50 text-amber-700' :
                                      'bg-rose-50 text-rose-700'
                                    }`}>
                                      {r.grade}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-slate-600 font-medium">
                                    {r.rank ? `#${r.rank}` : <span className="text-slate-300 italic">Not Ranked</span>}
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                                      r.status.toLowerCase() === 'passed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                                    }`}>
                                      {r.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* online exams */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm">Virtual Exam Attempts & Proctored Logs</h3>
                        <div className="space-y-4">
                          {(reportData as StudentReport).attempts.map((att) => (
                            <div key={att.id} className="border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/20">
                              <div>
                                <h4 className="font-bold text-slate-800 text-xs">
                                  {att.Assignment?.Test?.title || 'Online Assessment'}
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Attempted on {new Date(att.startedAt).toLocaleString()}
                                </p>
                                {att.Result && (
                                  <div className="text-xs text-slate-550 mt-2">
                                    <span className="font-semibold text-slate-705">
                                      Score: {att.Result.score} / {att.Result.maxScore} ({Math.round(att.Result.score / att.Result.maxScore * 100)}%)
                                    </span>
                                    {att.Result.feedback && (
                                      <p className="italic text-[10px] text-slate-400 mt-0.5">
                                        Feedback: &ldquo;{att.Result.feedback}&rdquo;
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="sm:text-right shrink-0 flex flex-col justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <div>
                                  Proctored Focus Loss: {' '}
                                  <span className={att.focusLoss > 2 ? 'text-rose-600 font-extrabold' : att.focusLoss > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                                    {att.focusLoss} times
                                  </span>
                                </div>
                                <div>
                                  Status: <span className="text-slate-650">{att.status}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}
