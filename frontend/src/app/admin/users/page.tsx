'use client';

import React, { useState, useEffect } from 'react';
import { fetchJson } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ORG_ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE' | 'INVITED';
  isActive: boolean;
  workspaceId: string | null;
  createdAt: string;
}

interface Workspace {
  id: string;
  name: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ORG_ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STUDENT'>('TEACHER');
  const [inviteWorkspaceId, setInviteWorkspaceId] = useState('');
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);
  const [inviteErrorMsg, setInviteErrorMsg] = useState<string | null>(null);

  // Status changing state (tracks ID of user currently being toggled)
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getCookie('session_token');
      const headers = { Authorization: `Bearer ${token}` };

      // Build query string
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const queryStr = params.toString() ? `?${params.toString()}` : '';

      // Fetch users and workspaces concurrently
      const [usersRes, workspacesRes] = await Promise.all([
        fetchJson<{ success: boolean; data: User[] }>(`/api/admin/users${queryStr}`, { headers }),
        fetchJson<{ success: boolean; data: Workspace[] }>('/api/admin/workspaces', { headers }),
      ]);

      setUsers(usersRes.data || []);
      setWorkspaces(workspacesRes.data || []);
    } catch (err: any) {
      console.error('Failed to load users page data:', err);
      setError(err.message || 'Failed to sync users database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search input to avoid overwhelming API on typing
    const delayDebounceFn = setTimeout(() => {
      loadData();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, roleFilter, statusFilter]);

  const handleToggleStatus = async (user: User) => {
    if (user.status === 'INVITED') {
      alert('Cannot change status of an invited user until they complete registration.');
      return;
    }

    try {
      setTogglingId(user.id);
      const token = getCookie('session_token');
      const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

      await fetchJson(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      // Optimistically update status in UI
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, status: nextStatus, isActive: nextStatus === 'ACTIVE' } : u))
      );
    } catch (err: any) {
      alert(`Failed to update status: ${err.message || 'Request failed'}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setSubmittingInvite(true);
      setInviteSuccessMsg(null);
      setInviteErrorMsg(null);
      const token = getCookie('session_token');

      const body: any = {
        email: inviteEmail,
        role: inviteRole,
      };
      if (inviteWorkspaceId) {
        body.workspaceId = inviteWorkspaceId;
      }

      await fetchJson('/api/admin/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      setInviteSuccessMsg(`Successfully sent invite to ${inviteEmail}!`);
      setInviteEmail('');
      setInviteWorkspaceId('');
      setInviteRole('TEACHER');
      
      // Reload users list to show the new INVITED entry
      loadData();

      // Close modal after a short delay
      setTimeout(() => {
        setInviteModalOpen(false);
        setInviteSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setInviteErrorMsg(err.message || 'Failed to dispatch workspace invitation.');
    } finally {
      setSubmittingInvite(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Platform Users</h2>
          <p className="text-slate-500 mt-1">Manage system memberships, roles, access permissions, and invites.</p>
        </div>
        <button
          onClick={() => setInviteModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-teal-950 hover:bg-teal-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm shrink-0 border border-teal-850"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Invite New User
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by name or email address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
          />
        </div>

        {/* Role Select */}
        <div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
          >
            <option value="">All Roles</option>
            <option value="ORG_ADMIN">Org Admin</option>
            <option value="PRINCIPAL">Principal</option>
            <option value="TEACHER">Teacher</option>
            <option value="STUDENT">Student</option>
          </select>
        </div>

        {/* Status Select */}
        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="INVITED">Invited</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-4 animate-pulse">
            <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-2xl">⏳</div>
            <div className="text-sm font-semibold">Loading tenant directory data...</div>
          </div>
        ) : error ? (
          <div className="p-12 text-center max-w-md mx-auto text-rose-600">
            <span className="text-2xl block mb-2">⚠️</span>
            <p className="text-sm font-bold">{error}</p>
            <button
              onClick={() => loadData()}
              className="mt-4 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-all"
            >
              Retry Load
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <span className="text-3xl block">👥</span>
            <h3 className="font-bold text-slate-700">No members found</h3>
            <p className="text-xs max-w-xs mx-auto">Try refining your search terms or filter selection parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Security Role</th>
                  <th className="px-6 py-4">System Status</th>
                  <th className="px-6 py-4">Workspace Mapping</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => {
                  const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  // Role badge logic
                  let roleBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (user.role === 'ORG_ADMIN') roleBadge = 'bg-teal-50 text-teal-800 border-teal-100/80';
                  if (user.role === 'PRINCIPAL') roleBadge = 'bg-indigo-50 text-indigo-800 border-indigo-100/80';
                  if (user.role === 'TEACHER') roleBadge = 'bg-amber-50 text-amber-850 border-amber-100/80';
                  if (user.role === 'STUDENT') roleBadge = 'bg-sky-50 text-sky-850 border-sky-100/80';

                  // Status badge logic
                  let statusBadge = 'bg-slate-100 text-slate-600 border-slate-200';
                  if (user.status === 'ACTIVE') statusBadge = 'bg-emerald-50 text-emerald-850 border-emerald-100/80';
                  if (user.status === 'INACTIVE') statusBadge = 'bg-rose-50 text-rose-850 border-rose-100/80';
                  if (user.status === 'INVITED') statusBadge = 'bg-slate-50 text-slate-650 border-slate-200/80';

                  // User primary workspace matching
                  const workspace = workspaces.find(w => w.id === user.workspaceId);

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          {/* Mini avatar */}
                          <div className="w-8.5 h-8.5 rounded-full bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600 flex items-center justify-center shrink-0">
                            {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{user.name || 'Anonymous User'}</div>
                            <div className="text-slate-400 text-xs">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5.5 rounded-full border ${roleBadge}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5.5 rounded-full border ${statusBadge}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        {workspace ? (
                          <span className="text-xs font-medium text-slate-700">{workspace.name}</span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="text-xs text-slate-400 font-medium">{joinedDate}</span>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        {user.status !== 'INVITED' ? (
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={togglingId === user.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              user.status === 'ACTIVE'
                                ? 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                            } disabled:opacity-50`}
                          >
                            {togglingId === user.id ? 'Updating...' : user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-350 italic">Awaiting Acceptance</span>
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
                <p className="text-xs text-slate-500 mt-1">Dispatches invitation email and seeds an inactive user mapping record.</p>
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
                    placeholder="name@organization.com"
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
                    <option value="ORG_ADMIN">Organization Admin</option>
                    <option value="PRINCIPAL">Principal</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="STUDENT">Student</option>
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
