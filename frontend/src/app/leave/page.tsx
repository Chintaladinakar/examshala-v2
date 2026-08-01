'use client';

import React, { useEffect, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import { CalendarOff, Plus, RefreshCw, X } from 'lucide-react';

type LeaveRow = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  reviewNote: string | null;
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
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
};

export default function MyLeavePage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();

  const [requests, setRequests] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const data = await apiJson<LeaveRow[]>('/api/leave/mine');
      setRequests(data);
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const created = await apiJson<LeaveRow>('/api/leave', {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate, reason }),
      });
      setRequests(prev => [created, ...prev]);
      showMessage('Leave request submitted', 'success');
      setModalOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (e: any) {
      showError(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto select-none">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <CalendarOff className="w-8 h-8 text-teal-800" />
                My Leave Requests
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Submit and track your leave requests.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="flex items-center gap-1.5 px-3.5 py-2 border hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" /> Request Leave
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="bg-white border rounded-2xl p-10 text-center text-xs font-bold text-slate-400">Loading…</div>
            )}
            {!loading && requests.length === 0 && (
              <div className="bg-white border rounded-2xl p-10 text-center text-xs font-bold text-slate-400">No leave requests yet</div>
            )}
            {!loading && requests.map(r => (
              <div key={r.id} className="bg-white border rounded-2xl p-5 shadow-3xs space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-800">
                    {new Date(r.startDate).toLocaleDateString()} → {new Date(r.endDate).toLocaleDateString()}
                  </p>
                  <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${STATUS_STYLES[r.status] || ''}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{r.reason}</p>
                {r.reviewNote && <p className="text-[10px] text-slate-400 font-semibold">Note: {r.reviewNote}</p>}
              </div>
            ))}
          </div>
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-5 select-none">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-base font-black text-slate-800">Request Leave</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Start Date</label>
                  <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">End Date</label>
                  <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
                </div>
              </div>
              <textarea
                required
                placeholder="Reason for leave..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35 resize-none"
              />
              <div className="flex gap-2 pt-2 border-t">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50">
                  {submitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
