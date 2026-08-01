'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import { CalendarOff, CheckCircle2, XCircle, RefreshCw, X, Clock } from 'lucide-react';

type LeaveRow = {
  id: string;
  requesterRole: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  reviewNote: string | null;
  createdAt: string;
  Requester: { id: string; name: string; email: string };
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
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
};

export default function PrincipalLeavePage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();
  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [requests, setRequests] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [submitting, setSubmitting] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<LeaveRow | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNote, setReviewNote] = useState('');

  const pendingCount = useMemo(() => requests.filter(r => r.status === 'pending').length, [requests]);
  const filtered = useMemo(() => tab === 'pending' ? requests.filter(r => r.status === 'pending') : requests, [requests, tab]);

  async function loadData() {
    try {
      setLoading(true);
      const data = await apiJson<LeaveRow[]>('/api/leave/all');
      setRequests(data);
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isPrincipalMode) loadData();
  }, [isPrincipalMode]);

  const openReview = (row: LeaveRow, action: 'approve' | 'reject') => {
    setReviewTarget(row);
    setReviewAction(action);
    setReviewNote('');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!reviewTarget) return;
    try {
      setSubmitting(true);
      const updated = await apiJson<LeaveRow>(`/api/leave/${reviewTarget.id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ action: reviewAction, reviewNote: reviewNote || undefined }),
      });
      setRequests(prev => prev.map(r => r.id === reviewTarget.id ? { ...r, status: updated.status, reviewNote: updated.reviewNote } : r));
      showMessage(reviewAction === 'approve' ? 'Leave approved' : 'Leave rejected', 'success');
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
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <CalendarOff className="w-8 h-8 text-teal-800" />
                Leave Management
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Review and act on teacher and student leave requests.
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
              onClick={() => setTab('pending')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                tab === 'pending' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Clock className="w-4 h-4" /> Pending
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black">{pendingCount}</span>
              )}
            </button>
            <button
              onClick={() => setTab('all')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                tab === 'all' ? 'border-teal-800 text-teal-900' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <CalendarOff className="w-4 h-4" /> All Requests
            </button>
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="bg-white border rounded-2xl p-10 text-center text-xs font-bold text-slate-400">Loading leave requests…</div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="bg-white border rounded-2xl p-10 text-center text-xs font-bold text-slate-400">No leave requests found</div>
            )}
            {!loading && filtered.map(r => (
              <div key={r.id} className="bg-white border rounded-2xl p-5 shadow-3xs space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black text-slate-800">{r.Requester.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{r.requesterRole}</p>
                  </div>
                  <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${STATUS_STYLES[r.status] || ''}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-semibold">
                  {new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-slate-500">{r.reason}</p>
                {r.status === 'pending' && (
                  <div className="flex items-center gap-1.5 pt-2 border-t">
                    <button
                      onClick={() => openReview(r, 'approve')}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => openReview(r, 'reject')}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
                {r.status !== 'pending' && r.reviewNote && (
                  <p className="text-[10px] text-slate-400 font-semibold pt-2 border-t">Note: {r.reviewNote}</p>
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
                {reviewAction === 'approve' ? 'Approve Leave' : 'Reject Leave'}
              </h3>
              <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 font-semibold">{reviewTarget.Requester.name}</p>
            <textarea
              placeholder="Optional note..."
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
