'use client';

import React, { useEffect, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import {
  Users,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  ShieldAlert,
  FolderOpen,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';

type JoinRequest = {
  id: string;
  name: string;
  email: string;
  requestedRole: string;
  requestDate: string;
  status: string;
};

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
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

export default function PrincipalJoinRequestsPage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();

  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);

  async function loadRequests() {
    try {
      setLoading(true);
      const res = await apiFetch<JoinRequest[]>('/api/principal/join-request');
      setRequests(res);
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isPrincipalMode) {
      loadRequests();
    }
  }, [isPrincipalMode]);

  const handleEvaluate = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      setEvaluatingId(requestId);
      await apiFetch<any>('/api/principal/join-request', {
        method: 'PATCH',
        body: JSON.stringify({ requestId, action })
      });
      showMessage(`Request has been ${action === 'approve' ? 'approved' : 'rejected'} successfully.`, 'success');
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (e: any) {
      showError(e);
    } finally {
      setEvaluatingId(null);
    }
  };

  if (!isPrincipalMode) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 p-8 flex flex-col justify-center items-center">
          <div className="bg-white border p-12 rounded-3xl shadow-xl max-w-md text-center space-y-4">
            <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
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
                <Users className="w-8 h-8 text-teal-800" />
                Workspace Admission requests
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Evaluate join applications from instructors and students attempting to link to your institution.
              </p>
            </div>
            
            <button
              onClick={loadRequests}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 border hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Lists
            </button>
          </div>

          {/* Join Requests Data Grid */}
          <div className="bg-white border rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                    <th className="px-6 py-4">Applicant Profile</th>
                    <th className="px-6 py-4">Applicant Contact</th>
                    <th className="px-6 py-4">Requested Role</th>
                    <th className="px-6 py-4">Submission Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-xs font-bold text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-teal-800" />
                          <span>Syncing admission queue...</span>
                        </div>
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-extrabold text-slate-500">Queue is completely empty</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">All join requests have been processed successfully.</p>
                      </td>
                    </tr>
                  ) : (
                    requests.map(r => {
                      const initials = r.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition-all text-xs text-slate-700">
                          {/* Name Avatar */}
                          <td className="px-6 py-4 font-semibold">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-700 to-teal-900 border border-teal-800/15 flex items-center justify-center font-bold text-white text-[11px] uppercase tracking-wider shrink-0 shadow-inner">
                                {initials}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-800 leading-snug">{r.name}</h4>
                                <span className="text-[8px] text-slate-400 font-extrabold tracking-widest uppercase">Member applicant</span>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{r.email}</span>
                            </div>
                          </td>

                          {/* Requested Role */}
                          <td className="px-6 py-4 font-bold">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[9px] uppercase tracking-wider ${
                              r.requestedRole.toLowerCase() === 'student'
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-black'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700 font-black'
                            }`}>
                              {r.requestedRole === 'Student' ? '🎓 Student' : '👨‍🏫 Tutor'}
                            </span>
                          </td>

                          {/* Request Date */}
                          <td className="px-6 py-4 text-slate-500 font-semibold">
                            <div className="flex items-center gap-1 text-[10px]">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{new Date(r.requestDate).toLocaleDateString()}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 text-[9px] font-black uppercase tracking-wider">
                              <Clock className="w-3 h-3 text-amber-500" /> Awaiting Review
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEvaluate(r.id, 'reject')}
                                disabled={evaluatingId !== null}
                                className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 hover:text-rose-600 text-rose-500 font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                              <button
                                onClick={() => handleEvaluate(r.id, 'approve')}
                                disabled={evaluatingId !== null}
                                className="px-3 py-1.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Approve Applicant
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
          </div>

        </div>
      </main>
    </div>
  );
}
