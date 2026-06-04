'use client';

import React, { useEffect, useState, useMemo } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import {
  ClipboardList,
  Search,
  Sliders,
  RefreshCw,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  XCircle,
  Eye,
  FileText,
  TrendingUp,
  X
} from 'lucide-react';

interface Attempt {
  id: string;
  studentName: string;
  studentEmail: string;
  startedAt: string | null;
  submittedAt: string | null;
  status: string; // 'in_progress' | 'submitted' | 'evaluated' | 'not_started'
  focusLossCount: number;
  score: number | null;
  maxScore: number;
  feedback: string;
}

interface OngoingAssessment {
  id: string;
  testId: string;
  title: string;
  duration: number;
  assignedByName: string;
  assignedAt: string;
  scheduleWindowStart: string | null;
  scheduleWindowEnd: string | null;
  isReady: boolean;
  progress: {
    total: number;
    completed: number;
    active: number;
  };
  averageScore: number | null;
  maxScore: number;
  attempts: Attempt[];
}

export default function OngoingAssessmentsPage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();

  const isPrincipalMode =
    (user?.role || '').toLowerCase() === 'principal' &&
    (user?.mode || 'principal') === 'principal';

  const [assessments, setAssessments] = useState<OngoingAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal details
  const [selectedAssessment, setSelectedAssessment] = useState<OngoingAssessment | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [attemptSearchQuery, setAttemptSearchQuery] = useState('');
  const [attemptStatusFilter, setAttemptStatusFilter] = useState('all');

  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch('/api/principal/ongoing-assessments');
      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error?.message || 'Failed to fetch assessments');
      }
      setAssessments(body.data);
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isPrincipalMode) {
      loadData();
    }
  }, [isPrincipalMode]);

  // Determine assessment status
  const getAssessmentStatus = (asm: OngoingAssessment) => {
    const now = new Date();
    const start = asm.scheduleWindowStart ? new Date(asm.scheduleWindowStart) : null;
    const end = asm.scheduleWindowEnd ? new Date(asm.scheduleWindowEnd) : null;

    if (start && now < start) return 'Scheduled';
    if (end && now > end) return 'Ended';
    return 'Active';
  };

  // Filtered assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter((asm) => {
      const matchesSearch = asm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asm.assignedByName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const status = getAssessmentStatus(asm).toLowerCase();
      const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  }, [assessments, searchQuery, statusFilter]);

  // Top Metrics
  const metrics = useMemo(() => {
    let activeCount = 0;
    let totalInProgress = 0;
    let totalCompleted = 0;
    let scoresSum = 0;
    let scoresCount = 0;

    assessments.forEach((asm) => {
      const status = getAssessmentStatus(asm);
      if (status === 'Active') activeCount++;
      totalInProgress += asm.progress.active;
      totalCompleted += asm.progress.completed;
      if (asm.averageScore !== null) {
        scoresSum += asm.averageScore;
        scoresCount++;
      }
    });

    return {
      activeAssessments: activeCount,
      inProgressAttempts: totalInProgress,
      completedAttempts: totalCompleted,
      workspaceAvgScore: scoresCount > 0 ? Math.round(scoresSum / scoresCount) : null,
    };
  }, [assessments]);

  // Modal attempts filtered
  const filteredAttempts = useMemo(() => {
    if (!selectedAssessment) return [];
    return selectedAssessment.attempts.filter((att) => {
      const matchesSearch = att.studentName.toLowerCase().includes(attemptSearchQuery.toLowerCase()) ||
        att.studentEmail.toLowerCase().includes(attemptSearchQuery.toLowerCase());
      
      const matchesStatus = attemptStatusFilter === 'all' || att.status === attemptStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [selectedAssessment, attemptSearchQuery, attemptStatusFilter]);

  const openDetailModal = (asm: OngoingAssessment) => {
    setSelectedAssessment(asm);
    setDetailModalOpen(true);
    setAttemptSearchQuery('');
    setAttemptStatusFilter('all');
  };

  if (!isPrincipalMode) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 p-8 flex flex-col justify-center items-center">
          <div className="bg-white border p-12 rounded-3xl shadow-xl max-w-md text-center space-y-4">
            <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-black text-slate-800">Access Denied</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              This dashboard is exclusive to Principals.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <DashboardSidebar />

      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto select-none">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ClipboardList className="w-8 h-8 text-teal-800" />
                Ongoing Assessments
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Monitor live exams, view current attempts, detect student focus loss flags, and audit results.
              </p>
            </div>
            
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Registry
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs flex items-center gap-4 hover:shadow-2xs transition-shadow duration-300">
              <div className="w-10 h-10 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center text-teal-700">
                <PlayCircle className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Exams</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{metrics.activeAssessments}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs flex items-center gap-4 hover:shadow-2xs transition-shadow duration-300">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-700">
                <Clock className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">In-Progress Attempts</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{metrics.inProgressAttempts}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs flex items-center gap-4 hover:shadow-2xs transition-shadow duration-300">
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
                <CheckCircle className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Completed Attempts</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{metrics.completedAttempts}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs flex items-center gap-4 hover:shadow-2xs transition-shadow duration-300">
              <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-700">
                <TrendingUp className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Workspace Avg Score</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">
                  {metrics.workspaceAvgScore !== null ? `${metrics.workspaceAvgScore}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 border border-slate-200 rounded-2xl shadow-3xs">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search assessments by title or teacher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700/35 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 self-end md:self-auto">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-xl bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>

          {/* Tabular View */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                    <th className="px-6 py-4">Assessment / Test</th>
                    <th className="px-6 py-4">Assigned By</th>
                    <th className="px-6 py-4">Scheduling Window</th>
                    <th className="px-6 py-4">Attempts Progress</th>
                    <th className="px-6 py-4">Avg Score</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-xs font-bold text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-teal-800" />
                          <span>Syncing workspace assessments...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredAssessments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-extrabold text-slate-500">No assessments found</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Try clearing filters or checking backend settings.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAssessments.map((asm) => {
                      const status = getAssessmentStatus(asm);
                      const pct = asm.progress.total > 0 
                        ? Math.round((asm.progress.completed / asm.progress.total) * 100) 
                        : 0;

                      return (
                        <tr key={asm.id} className="hover:bg-slate-50/50 transition-all text-xs text-slate-700">
                          {/* Assessment title & duration */}
                          <td className="px-6 py-4 font-semibold">
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-teal-700" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-800 leading-snug">{asm.title}</h4>
                                <span className="text-[9px] text-slate-400 font-bold flex items-center gap-0.5 mt-0.5">
                                  <Clock className="w-3 h-3 text-slate-400" /> {asm.duration} Mins Duration
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Assigned By */}
                          <td className="px-6 py-4 font-medium text-slate-600">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {asm.assignedByName}
                            </span>
                          </td>

                          {/* Schedule Window */}
                          <td className="px-6 py-4">
                            <div className="space-y-0.5 text-[10px] font-bold text-slate-500">
                              <div className="flex items-center gap-1">
                                <span className="text-emerald-500">Start:</span>
                                <span>{asm.scheduleWindowStart ? new Date(asm.scheduleWindowStart).toLocaleString() : 'Immediate'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-rose-500">End:</span>
                                <span>{asm.scheduleWindowEnd ? new Date(asm.scheduleWindowEnd).toLocaleString() : 'No Limit'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Attempts progress bar */}
                          <td className="px-6 py-4">
                            <div className="w-36 space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>{asm.progress.completed}/{asm.progress.total} Completed</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-teal-700 h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                              {asm.progress.active > 0 && (
                                <p className="text-[9px] text-indigo-500 font-extrabold flex items-center gap-0.5">
                                  ⚡ {asm.progress.active} Active Attempts Now
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Average Score */}
                          <td className="px-6 py-4 font-black text-slate-800">
                            {asm.averageScore !== null ? (
                              <span className="inline-flex items-center gap-0.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200/50">
                                {asm.averageScore}
                                <span className="text-[10px] text-slate-400 font-normal">/{asm.maxScore}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 italic font-semibold">No results</span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${
                              status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : status === 'Scheduled'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              <span className="w-1 h-1 rounded-full bg-current"></span>
                              {status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openDetailModal(asm)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-3xs"
                            >
                              <Eye className="w-3.5 h-3.5" /> Audit Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* ─── AUDIT DETAILS MODAL ──────────────────────────────────────────────── */}
      {detailModalOpen && selectedAssessment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-teal-950 p-6 text-white flex items-center justify-between select-none">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-teal-400 animate-pulse" /> Live Audit: {selectedAssessment.title}
                </h3>
                <p className="text-[10px] text-teal-200 mt-0.5 font-semibold">
                  Workspace audit: check active attempts, evaluate focus loss triggers, and view logs.
                </p>
              </div>
              <button 
                onClick={() => setDetailModalOpen(false)} 
                className="text-teal-300 hover:text-white transition-all cursor-pointer p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics cards inside modal */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
              <div className="bg-white border border-slate-200 p-3.5 rounded-xl text-center space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Total Registered</span>
                <span className="text-base font-black text-slate-800">{selectedAssessment.attempts.length}</span>
              </div>
              <div className="bg-white border border-slate-200 p-3.5 rounded-xl text-center space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">In Progress</span>
                <span className="text-base font-black text-indigo-600">
                  {selectedAssessment.attempts.filter(a => a.status === 'in_progress').length}
                </span>
              </div>
              <div className="bg-white border border-slate-200 p-3.5 rounded-xl text-center space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Completed</span>
                <span className="text-base font-black text-emerald-600">
                  {selectedAssessment.attempts.filter(a => a.status === 'evaluated' || a.status === 'submitted').length}
                </span>
              </div>
              <div className="bg-white border border-slate-200 p-3.5 rounded-xl text-center space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block text-rose-500 flex items-center justify-center gap-0.5">
                  <AlertTriangle className="w-3 h-3 text-rose-500" /> Focus Losses
                </span>
                <span className="text-base font-black text-slate-800">
                  {selectedAssessment.attempts.reduce((sum, a) => sum + a.focusLossCount, 0)}
                </span>
              </div>
            </div>

            {/* Search and Filters inside modal */}
            <div className="p-4 bg-white border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter candidates..."
                  value={attemptSearchQuery}
                  onChange={(e) => setAttemptSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-lg text-xs font-semibold placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <select
                value={attemptStatusFilter}
                onChange={(e) => setAttemptStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 border rounded-lg bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer w-full md:w-36"
              >
                <option value="all">All States</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="evaluated">Evaluated</option>
                <option value="not_started">Not Started</option>
              </select>
            </div>

            {/* Candidates attempts list */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-3xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] uppercase font-extrabold text-slate-500 tracking-wider">
                      <th className="px-5 py-3.5">Candidate</th>
                      <th className="px-5 py-3.5">Timeline</th>
                      <th className="px-5 py-3.5">Anti-Cheat Flags</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Marks</th>
                      <th className="px-5 py-3.5 text-right">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                    {filteredAttempts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-slate-400 italic">
                          No candidates found matching the filters.
                        </td>
                      </tr>
                    ) : (
                      filteredAttempts.map((att) => {
                        const hasFocusLoss = att.focusLossCount > 0;
                        const pct = att.score !== null ? Math.round((att.score / att.maxScore) * 100) : null;

                        return (
                          <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Candidate details */}
                            <td className="px-5 py-3.5 font-bold">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 uppercase text-[10px] border border-slate-200 shrink-0">
                                  {att.studentName.charAt(0)}
                                </div>
                                <div>
                                  <h5 className="text-slate-800 leading-snug">{att.studentName}</h5>
                                  <p className="text-[9px] text-slate-400 font-semibold">{att.studentEmail}</p>
                                </div>
                              </div>
                            </td>

                            {/* Timeline details */}
                            <td className="px-5 py-3.5 text-[10px] text-slate-500">
                              <div className="space-y-0.5">
                                <div><span className="font-bold">Started:</span> {att.startedAt ? new Date(att.startedAt).toLocaleString() : '—'}</div>
                                <div><span className="font-bold">Submitted:</span> {att.submittedAt ? new Date(att.submittedAt).toLocaleString() : '—'}</div>
                              </div>
                            </td>

                            {/* Anti-cheat audit info */}
                            <td className="px-5 py-3.5">
                              {hasFocusLoss ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase ${
                                  att.focusLossCount >= 3 
                                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                                    : 'bg-amber-50 border-amber-200 text-amber-600'
                                }`}>
                                  <AlertTriangle className="w-3 h-3 text-current" />
                                  {att.focusLossCount} Focus Loss{att.focusLossCount > 1 ? 'es' : ''}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold border bg-slate-100 border-slate-200 text-slate-400 uppercase">
                                  Secure Log
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                att.status === 'evaluated'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : att.status === 'submitted'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : att.status === 'in_progress'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}>
                                {att.status}
                              </span>
                            </td>

                            {/* Marks */}
                            <td className="px-5 py-3.5 font-bold">
                              {att.score !== null ? (
                                <div className="space-y-0.5">
                                  <span className="text-slate-800 text-sm font-black">{att.score}</span>
                                  <span className="text-slate-400">/{att.maxScore}</span>
                                  <span className={`block text-[9px] font-black ${
                                    pct && pct >= 80 ? 'text-emerald-600' : 'text-indigo-600'
                                  }`}>{pct}%</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic font-semibold">Ungraded</span>
                              )}
                            </td>

                            {/* Remarks */}
                            <td className="px-5 py-3.5 text-right font-semibold text-slate-500 max-w-[200px] truncate" title={att.feedback}>
                              {att.feedback || '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Close Audit logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
