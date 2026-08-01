'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import { FileText, Search, CheckCircle2, XCircle, RefreshCw, Clock, ClipboardCheck, X } from 'lucide-react';

type ExamRow = {
  id: string;
  title: string;
  examType: string;
  subject: string | null;
  status: string;
  reviewStatus: string;
  reviewNote: string | null;
  durationMinutes: number;
  passingPercentage: number | null;
  Class: { id: string; name: string };
  _count: { examQuestions: number; attempts: number };
  createdAt: string;
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || 'Server operation failed');
  }
  return body.data as T;
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
};

const REVIEW_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
};

export default function PrincipalExamsPage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();
  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [exams, setExams] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'pending'>('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<ExamRow | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNote, setReviewNote] = useState('');

  const pendingCount = useMemo(() => exams.filter(e => e.reviewStatus === 'pending').length, [exams]);

  const filtered = useMemo(() => {
    return exams.filter(e => {
      const matchesTab = tab === 'all' || e.reviewStatus === 'pending';
      const matchesStatus = !statusFilter || e.status === statusFilter;
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.Class.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesStatus && matchesSearch;
    });
  }, [exams, tab, statusFilter, searchQuery]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await apiJson<ExamRow[]>('/api/exams');
      setExams(data);
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isPrincipalMode) loadData();
  }, [isPrincipalMode]);

  const openReview = (exam: ExamRow, action: 'approve' | 'reject') => {
    setReviewTarget(exam);
    setReviewAction(action);
    setReviewNote('');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!reviewTarget) return;
    try {
      setSubmitting(true);
      const updated = await apiJson<ExamRow>(`/api/exams/${reviewTarget.id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ action: reviewAction, reviewNote: reviewNote || undefined }),
      });
      setExams(prev => prev.map(e => e.id === reviewTarget.id ? { ...e, reviewStatus: updated.reviewStatus, reviewNote: updated.reviewNote } : e));
      showMessage(reviewAction === 'approve' ? 'Exam approved' : 'Exam rejected', 'success');
      setReviewModalOpen(false);
    } catch (e: any) {
      showError(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isPrincipalMode) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 p-8 flex flex-col justify-center items-center">
          <div className="bg-white border p-12 rounded-3xl shadow-xl max-w-md text-center space-y-4">
            <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-black text-slate-800">Access Denied</h2>
            <p className="text-slate-500 text-sm leading-relaxed">This dashboard is exclusive to Principals.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto select-none">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-8 h-8 text-teal-800" />
                Exam Oversight
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Review and approve exams before publish, across every class in your institution.
              </p>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3.5 py-2 border hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setTab('all')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                tab === 'all' ? 'border-teal-800 text-teal-900' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <FileText className="w-4 h-4" /> All Exams
            </button>
            <button
              onClick={() => setTab('pending')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                tab === 'pending' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Clock className="w-4 h-4" /> Pending Review
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black">{pendingCount}</span>
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 border rounded-2xl shadow-3xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search exams by title, subject, or class..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700/35 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="bg-white border rounded-2xl shadow-3xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Exam</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Questions</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Review</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading && (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-xs text-slate-400 font-semibold">Loading exams…</td></tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-xs text-slate-400 font-semibold">No exams found</td></tr>
                  )}
                  {!loading && filtered.map(exam => (
                    <tr key={exam.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-xs font-black text-slate-800">{exam.title}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{exam.examType} · {exam.subject || 'General'}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">{exam.Class.name}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600">
                        {exam._count.examQuestions} questions · {exam._count.attempts} attempts
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${STATUS_STYLES[exam.status] || ''}`}>
                          {exam.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${REVIEW_STYLES[exam.reviewStatus] || ''}`}>
                          {exam.reviewStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {exam.reviewStatus === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openReview(exam, 'approve')}
                              className="flex items-center gap-1 px-2.5 py-1.5 border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => openReview(exam, 'reject')}
                              className="flex items-center gap-1 px-2.5 py-1.5 border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold flex items-center justify-end gap-1">
                            <ClipboardCheck className="w-3.5 h-3.5" /> Reviewed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {reviewModalOpen && reviewTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-5 select-none">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-base font-black text-slate-800">
                {reviewAction === 'approve' ? 'Approve Exam' : 'Reject Exam'}
              </h3>
              <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 font-semibold">{reviewTarget.title}</p>
            <textarea
              placeholder="Optional note for the exam creator..."
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35 resize-none"
            />
            <div className="flex gap-2 pt-2 border-t">
              <button type="button" onClick={() => setReviewModalOpen(false)}
                className="flex-1 px-4 py-2.5 border text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={submitting}
                className={`flex-1 px-4 py-2.5 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50 ${
                  reviewAction === 'approve' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'
                }`}
              >
                {submitting ? 'Saving…' : reviewAction === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
