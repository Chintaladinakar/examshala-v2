'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import { BookOpen, Search, CheckCircle2, XCircle, RefreshCw, Clock, ClipboardCheck, X } from 'lucide-react';

type QuestionRow = {
  id: string;
  type: string;
  difficulty: string;
  subject: string;
  questionText: string;
  reviewStatus: string;
  reviewNote: string | null;
  CreatedBy: { id: string; name: string };
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

const REVIEW_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
};

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-teal-50 text-teal-700 border-teal-100',
  medium: 'bg-amber-50 text-amber-700 border-amber-100',
  hard: 'bg-rose-50 text-rose-700 border-rose-100',
  expert: 'bg-violet-50 text-violet-700 border-violet-100',
};

export default function PrincipalQuestionBankPage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();
  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'pending'>('all');
  const [submitting, setSubmitting] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<QuestionRow | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNote, setReviewNote] = useState('');

  const pendingCount = useMemo(() => questions.filter(q => q.reviewStatus === 'pending').length, [questions]);

  const filtered = useMemo(() => {
    return questions.filter(q => {
      const matchesTab = tab === 'all' || q.reviewStatus === 'pending';
      const matchesSearch = q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [questions, tab, searchQuery]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await apiJson<QuestionRow[]>('/api/questions?limit=100');
      setQuestions(data);
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isPrincipalMode) loadData();
  }, [isPrincipalMode]);

  const openReview = (question: QuestionRow, action: 'approve' | 'reject') => {
    setReviewTarget(question);
    setReviewAction(action);
    setReviewNote('');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!reviewTarget) return;
    try {
      setSubmitting(true);
      const updated = await apiJson<QuestionRow>(`/api/questions/${reviewTarget.id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ action: reviewAction, reviewNote: reviewNote || undefined }),
      });
      setQuestions(prev => prev.map(q => q.id === reviewTarget.id ? { ...q, reviewStatus: updated.reviewStatus, reviewNote: updated.reviewNote } : q));
      showMessage(reviewAction === 'approve' ? 'Question approved' : 'Question rejected', 'success');
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
                <BookOpen className="w-8 h-8 text-teal-800" />
                Question Bank Oversight
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Review institution-wide question submissions before they count as approved content.
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
              <BookOpen className="w-4 h-4" /> All Questions
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

          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions by text or subject..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700/35 transition-all shadow-3xs"
            />
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="bg-white border rounded-2xl p-10 text-center text-xs font-bold text-slate-400">Loading questions…</div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="bg-white border rounded-2xl p-10 text-center text-xs font-bold text-slate-400">No questions found</div>
            )}
            {!loading && filtered.map(q => (
              <div key={q.id} className="bg-white border rounded-2xl p-5 shadow-3xs space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-xs font-bold text-slate-800 flex-1">{q.questionText}</p>
                  <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${REVIEW_STYLES[q.reviewStatus] || ''}`}>
                    {q.reviewStatus}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold">
                    {q.subject}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold">
                    {q.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${DIFFICULTY_STYLES[q.difficulty] || ''}`}>
                    {q.difficulty}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">by {q.CreatedBy.name}</span>
                </div>
                {q.reviewStatus === 'pending' && (
                  <div className="flex items-center gap-1.5 pt-2 border-t">
                    <button
                      onClick={() => openReview(q, 'approve')}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => openReview(q, 'reject')}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
                {q.reviewStatus !== 'pending' && q.reviewNote && (
                  <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 pt-2 border-t">
                    <ClipboardCheck className="w-3.5 h-3.5" /> {q.reviewNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {reviewModalOpen && reviewTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-5 select-none">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-base font-black text-slate-800">
                {reviewAction === 'approve' ? 'Approve Question' : 'Reject Question'}
              </h3>
              <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 font-semibold line-clamp-3">{reviewTarget.questionText}</p>
            <textarea
              placeholder="Optional note for the author..."
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
