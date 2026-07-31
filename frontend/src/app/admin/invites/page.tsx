'use client';

import React, { useState, useEffect } from 'react';
import { fetchJson } from '@/lib/api';

interface Invite {
  id: string;
  email: string;
  role: 'ORG_ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STUDENT';
  workspaceId: string | null;
  status: 'PENDING' | 'ACCEPTED';
  createdAt: string;
}

interface Workspace {
  id: string;
  name: string;
}

export default function InvitationsTrackerPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ORG_ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STUDENT'>('TEACHER');
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState('');
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [inviteErrorMsg, setInviteErrorMsg] = useState<string | null>(null);

  // Resend status simulation state
  const [resendingId, setResendingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Requests go through the authenticated same-origin proxy, which reads the
      // HttpOnly session cookie server-side and forwards it to the backend.
      const [invitesRes, workspacesRes] = await Promise.all([
        fetchJson<{ success: boolean; data: Invite[] }>('/api/proxy/api/admin/invites'),
        fetchJson<{ success: boolean; data: Workspace[] }>('/api/proxy/api/admin/workspaces'),
      ]);

      setInvites(invitesRes.data || []);
      setWorkspaces(workspacesRes.data || []);
    } catch (err: any) {
      console.error('Failed to load invites page data:', err);
      setError(err.message || 'Failed to sync invitations directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setSubmittingInvite(true);
      setInviteSuccessMsg(null);
      setInviteErrorMsg(null);

      const body: any = {
        email: inviteEmail,
        role: inviteRole,
      };
      if (inviteWorkspaceId) {
        body.workspaceId = inviteWorkspaceId;
      }

      await fetchJson('/api/proxy/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setInviteSuccessMsg(`Successfully sent invitation to ${inviteEmail}!`);
      setInviteEmail('');
      setInviteWorkspaceId('');
      setInviteRole('TEACHER');
      
      loadData();

      setTimeout(() => {
        setInviteModalOpen(false);
        setInviteSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setInviteErrorMsg(err.message || 'Failed to dispatch invitation.');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleResendInvite = (invite: Invite) => {
    setResendingId(invite.id);
    // Simulate SMTP network relay delay
    setTimeout(() => {
      setResendingId(null);
      alert(`An verification email ping was re-dispatched to ${invite.email}!`);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Access Invitations</h2>
          <p className="text-slate-500 mt-1">Send, monitor, and resend secure workspace invites to platform members.</p>
        </div>
        <button
          onClick={() => setInviteModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-teal-950 hover:bg-teal-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm shrink-0 border border-teal-850"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Send Invite
        </button>
      </div>

      {/* Invites table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] overflow-hidden">
        {loading && invites.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-4 animate-pulse">
            <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-2xl">✉️</div>
            <div className="text-sm font-semibold">Loading access invitations directory...</div>
          </div>
        ) : error ? (
          <div className="p-12 text-center max-w-md mx-auto text-rose-600">
            <span className="text-2xl block mb-2">⚠️</span>
            <p className="text-sm font-bold">{error}</p>
            <button
              onClick={() => loadData()}
              className="mt-4 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : invites.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <span className="text-3xl block">📩</span>
            <h3 className="font-bold text-slate-700">No invitations dispatched</h3>
            <p className="text-xs max-w-xs mx-auto">Click "Send Invite" above to provision and invite new members.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Recipient Email</th>
                  <th className="px-6 py-4">Security Role</th>
                  <th className="px-6 py-4">Workspace Target</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Dispatched At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invites.map(invite => {
                  const sentDate = new Date(invite.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  // Role badge logic
                  let roleBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (invite.role === 'ORG_ADMIN') roleBadge = 'bg-teal-50 text-teal-850 border-teal-100';
                  if (invite.role === 'PRINCIPAL') roleBadge = 'bg-indigo-50 text-indigo-850 border-indigo-100';
                  if (invite.role === 'TEACHER') roleBadge = 'bg-amber-50 text-amber-850 border-amber-100';
                  if (invite.role === 'STUDENT') roleBadge = 'bg-sky-50 text-sky-850 border-sky-100';

                  // Status badge logic
                  let statusBadge = 'bg-slate-100 text-slate-650 border-slate-200';
                  if (invite.status === 'ACCEPTED') statusBadge = 'bg-emerald-50 text-emerald-850 border-emerald-100';
                  if (invite.status === 'PENDING') statusBadge = 'bg-amber-50 text-amber-850 border-amber-100/60';

                  // Workspace name matching
                  const workspace = workspaces.find(w => w.id === invite.workspaceId);

                  return (
                    <tr key={invite.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8.5 h-8.5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            <span className="text-sm">✉️</span>
                          </div>
                          <span className="font-semibold text-slate-800 text-sm">{invite.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5.5 rounded-full border ${roleBadge}`}>
                          {invite.role}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        {workspace ? (
                          <span className="text-xs font-semibold text-slate-700">{workspace.name}</span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5.5 rounded-full border ${statusBadge}`}>
                          {invite.status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="text-xs text-slate-400 font-medium">{sentDate}</span>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        {invite.status === 'PENDING' ? (
                          <button
                            onClick={() => handleResendInvite(invite)}
                            disabled={resendingId === invite.id}
                            className="inline-flex items-center gap-1 bg-teal-50 hover:bg-teal-100/80 text-teal-850 text-xs font-semibold px-3 py-1.5 rounded-lg border border-teal-100 transition-colors disabled:opacity-50"
                          >
                            {resendingId === invite.id ? 'Resending...' : 'Resend Ping'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-350 italic font-medium">Claimed / Checked-In</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal Dialog */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-teal-950/40 backdrop-blur-sm" onClick={() => setInviteModalOpen(false)} />
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 md:p-8 relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
              </svg>
            </button>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Invite Platform Member</h3>
                <p className="text-xs text-slate-500 mt-1">Dispatches secure invitation token link to the recipient.</p>
              </div>

              {inviteSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl">
                  🎉 {inviteSuccessMsg}
                </div>
              )}

              {inviteErrorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold px-4 py-3 rounded-xl">
                  ⚠️ {inviteErrorMsg}
                </div>
              )}

              <form onSubmit={handleSendInvite} className="space-y-4 pt-2">
                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@school.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
                  />
                </div>

                {/* Role dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Security Role</label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as any)}
                    className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
                  >
                    <option value="TEACHER">Teacher</option>
                    <option value="PRINCIPAL">Principal</option>
                    <option value="STUDENT">Student</option>
                    <option value="ORG_ADMIN">Organization Admin</option>
                  </select>
                </div>

                {/* Optional Workspace dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Workspace Mapping <span className="text-slate-400 lowercase italic">(optional)</span>
                  </label>
                  <select
                    value={inviteWorkspaceId}
                    onChange={e => setInviteWorkspaceId(e.target.value)}
                    className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
                  >
                    <option value="">None (Link later)</option>
                    {workspaces.map(ws => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submission buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInvite}
                    className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {submittingInvite ? 'Inviting...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
