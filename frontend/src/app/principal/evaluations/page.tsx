'use client';

import React, { useEffect, useState, useMemo } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import {
  Trophy,
  Search,
  BookOpen,
  User,
  X,
  ChevronRight,
  AlertCircle,
  MessageSquare,
  Calendar,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  FolderOpen,
  Clock
} from 'lucide-react';

type Feedback = {
  id: string;
  comment: string;
  createdAt: string;
  creatorName: string;
};

type Submission = {
  id: string;
  studentName: string;
  studentId: string;
  assignmentId: string;
  assignmentTitle: string;
  class: string;
  teacherName: string;
  submittedAt: string;
  originalScore: number;
  score: number;
  maxScore: number;
  fileUrl: string;
  textSubmission: string;
  feedbacks: Feedback[];
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || 'Server request failed');
  }
  return body.data as T;
}

export default function PrincipalEvaluationsPage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();

  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Modals & Details
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [overrideScore, setOverrideScore] = useState<number | ''>('');
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingOverride, setSubmittingOverride] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const res = await apiJson<Submission[]>('/api/principal/evaluations');
      setSubmissions(res);
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

  // Derived filter options
  const classesList = useMemo(() => {
    return Array.from(new Set(submissions.map(s => s.class)));
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => {
      const matchesSearch =
        s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.assignmentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = !classFilter || s.class === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [submissions, searchQuery, classFilter]);

  const handleOverrideScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || overrideScore === '') return;
    try {
      setSubmittingOverride(true);
      const res = await apiJson<any>('/api/principal/evaluations', {
        method: 'PATCH',
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          action: 'override_marks',
          score: Number(overrideScore),
        }),
      });
      setSubmissions(prev =>
        prev.map(s => (s.id === selectedSubmission.id ? { ...s, score: res.score } : s))
      );
      setSelectedSubmission(prev => (prev ? { ...prev, score: res.score } : null));
      showMessage('Submission score overridden successfully', 'success');
      setOverrideScore('');
    } catch (err: any) {
      showError(err);
    } finally {
      setSubmittingOverride(false);
    }
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || !feedbackText.trim()) return;
    try {
      setSubmittingFeedback(true);
      const res = await apiJson<any>('/api/principal/evaluations', {
        method: 'PATCH',
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          action: 'add_feedback',
          feedback: feedbackText,
          assignmentId: selectedSubmission.assignmentId,
        }),
      });
      setSubmissions(prev =>
        prev.map(s =>
          s.id === selectedSubmission.id
            ? { ...s, feedbacks: [res, ...s.feedbacks] }
            : s
        )
      );
      setSelectedSubmission(prev =>
        prev ? { ...prev, feedbacks: [res, ...prev.feedbacks] } : null
      );
      showMessage('Review feedback posted successfully', 'success');
      setFeedbackText('');
    } catch (err: any) {
      showError(err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const openDetailModal = (sub: Submission) => {
    setSelectedSubmission(sub);
    setDetailModalOpen(true);
  };

  if (!isPrincipalMode) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 p-8 flex flex-col justify-center items-center">
          <div className="bg-white border p-12 rounded-3xl shadow-xl max-w-md text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-black text-slate-800">Access Denied</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              This dashboard is exclusive to Principals in Principal Mode. Please toggle your role from the sidebar.
            </p>
          </div>
        </main>
      </div>
    );
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
                <Trophy className="w-8 h-8 text-teal-800" />
                Evaluations Override
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Audit student submissions, modify grades, and post administrative review comments directly.
              </p>
            </div>
            
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-4 py-2 border hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Evaluations
            </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white border p-5 rounded-2xl shadow-3xs flex items-center gap-4">
              <div className="w-10 h-10 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center text-teal-700 font-black">
                📝
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Submissions</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{submissions.length}</p>
              </div>
            </div>

            <div className="bg-white border p-5 rounded-2xl shadow-3xs flex items-center gap-4">
              <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-center text-violet-700 font-black">
                🟣
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Overridden Scores</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">
                  {submissions.filter(s => s.score !== s.originalScore).length}
                </p>
              </div>
            </div>

            <div className="bg-white border p-5 rounded-2xl shadow-3xs flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-black">
                🟢
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Reviewed Submissions</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">
                  {submissions.filter(s => s.feedbacks.length > 0).length}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 border rounded-2xl shadow-3xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student, assignment, or teacher..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700/35 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="px-3 py-2 border rounded-xl bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">All Classes</option>
                {classesList.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Roster Table */}
          <div className="bg-white border rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Assignment Scope</th>
                    <th className="px-6 py-4">Evaluator</th>
                    <th className="px-6 py-4">Marks (Current / Max)</th>
                    <th className="px-6 py-4">Feedback Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-xs font-bold text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-teal-800" />
                          <span>Syncing evaluation registry...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-extrabold text-slate-500">No submissions found</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Try adjusting your filters or search keywords.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map(sub => {
                      const overridden = sub.score !== sub.originalScore;
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-all text-xs text-slate-700">
                          {/* Student */}
                          <td className="px-6 py-4 font-semibold">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border flex items-center justify-center font-bold text-slate-600 text-[10px] uppercase shrink-0 shadow-inner">
                                {sub.studentName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-800 leading-snug">{sub.studentName}</h4>
                                <span className="text-[9px] text-slate-400 font-extrabold uppercase bg-slate-100 border px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                  {sub.class}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Scope */}
                          <td className="px-6 py-4">
                            <div className="space-y-0.5">
                              <h4 className="font-extrabold text-slate-800">{sub.assignmentTitle}</h4>
                              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </td>

                          {/* Evaluator */}
                          <td className="px-6 py-4 font-semibold text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {sub.teacherName}
                            </span>
                          </td>

                          {/* Score */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-black ${overridden ? 'text-violet-600' : 'text-slate-800'}`}>
                                {sub.score}
                              </span>
                              <span className="text-slate-400">/</span>
                              <span className="text-slate-500 font-bold">{sub.maxScore}</span>
                              {overridden && (
                                <span className="text-[8px] font-black uppercase bg-violet-100 border border-violet-200 text-violet-700 px-1.5 py-0.5 rounded-sm">
                                  Overridden
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Feedback status */}
                          <td className="px-6 py-4">
                            {sub.feedbacks.length > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-200 text-emerald-700 text-[9px] font-extrabold uppercase tracking-wide">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {sub.feedbacks.length} Reviews
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[9px] font-extrabold uppercase tracking-wide">
                                <Clock className="w-3 h-3 text-slate-400" /> No Review
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openDetailModal(sub)}
                              className="px-3 py-1.5 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                            >
                              Evaluate
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

      {/* ─── EVALUATE DETAIL MODAL ────────────────────────────────────────────── */}
      {detailModalOpen && selectedSubmission && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-teal-950 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-400" /> Administrative Evaluation
                </h3>
                <p className="text-[10px] text-teal-200 mt-0.5">
                  Overriding scores or posting reviews logs actions workspace-wide.
                </p>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="text-teal-300 hover:text-white transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
              {/* Student and Assignment info */}
              <div className="grid md:grid-cols-2 gap-4 bg-slate-50 p-4 border rounded-2xl text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Candidate</span>
                  <h4 className="font-extrabold text-slate-800 text-sm mt-0.5">{selectedSubmission.studentName}</h4>
                  <p className="text-slate-500 mt-0.5">{selectedSubmission.class}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Assignment</span>
                  <h4 className="font-extrabold text-slate-800 text-sm mt-0.5">{selectedSubmission.assignmentTitle}</h4>
                  <p className="text-slate-500 mt-0.5">Evaluated by: {selectedSubmission.teacherName}</p>
                </div>
              </div>

              {/* Text Submission details */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Submission Text</span>
                <div className="bg-slate-50 border p-4 rounded-2xl text-xs font-medium leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {selectedSubmission.textSubmission || 'No text content provided.'}
                </div>
              </div>

              {/* Score Overrides Form */}
              <div className="border rounded-2xl p-4 bg-slate-50/70 space-y-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Override Evaluation Score</span>
                <form onSubmit={handleOverrideScore} className="flex items-end gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-slate-400">Score Override ({selectedSubmission.maxScore} Max)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={selectedSubmission.maxScore}
                      placeholder={selectedSubmission.score.toString()}
                      value={overrideScore}
                      onChange={e => setOverrideScore(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="w-32 px-3 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingOverride}
                    className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs rounded-xl disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {submittingOverride ? 'Overriding...' : 'Apply Score Override'}
                  </button>
                </form>
              </div>

              {/* Feedback History & Form */}
              <div className="space-y-4 border-t pt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block flex items-center gap-1">
                  <MessageSquare className="w-4 h-4 text-slate-400" /> Review Feedbacks & Comments
                </span>
                
                {/* Form */}
                <form onSubmit={handleAddFeedback} className="space-y-2">
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter review remarks or corrections to share with student/teacher..."
                    value={feedbackText}
                    onChange={e => setFeedbackText(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-xs font-semibold focus:outline-none placeholder:text-slate-400"
                  />
                  <div className="text-right">
                    <button
                      type="submit"
                      disabled={submittingFeedback}
                      className="px-4 py-2 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {submittingFeedback ? 'Posting...' : 'Post Admin Review'}
                    </button>
                  </div>
                </form>

                {/* History list */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {selectedSubmission.feedbacks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No feedback entries recorded yet.</p>
                  ) : (
                    selectedSubmission.feedbacks.map(f => (
                      <div key={f.id} className="bg-slate-50 p-3.5 border border-slate-200/60 rounded-2xl space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                          <span>{f.creatorName}</span>
                          <span>{new Date(f.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 leading-relaxed">{f.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
