'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import {
  Mail,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  XCircle,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

type Invitation = {
  id: string;
  workspace: string;
  invitedUser: string;
  email: string;
  role: string;
  status: string; // PENDING, ACCEPTED, EXPIRED
  sentDate: string;
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
    throw new Error(body?.error?.message || 'Admin invitations request failed');
  }
  return body.data as T;
}

export default function WorkspaceInvitationsPage() {
  const { user, loading: profileLoading } = useUser();
  const { showError } = useToast();
  const router = useRouter();

  const role = user?.role?.toLowerCase();
  const isOrgAdmin = role === 'org_admin';

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  async function loadInvitations() {
    try {
      setLoading(true);
      const res = await apiFetch<Invitation[]>('/api/admin/workspace-invitations');
      setInvitations(res);
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOrgAdmin) {
      loadInvitations();
    }
  }, [isOrgAdmin]);

  const filteredInvitations = useMemo(() => {
    return invitations.filter(i => {
      const matchesSearch = 
        i.workspace.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.invitedUser.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
      const matchesRole = roleFilter === 'ALL' || i.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [invitations, searchQuery, statusFilter, roleFilter]);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-slate-955 flex flex-col justify-center items-center select-none text-slate-100 relative overflow-hidden">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
          <span className="text-xs font-bold text-slate-400">Verifying administrator authorization...</span>
        </div>
      </div>
    );
  }

  if (!isOrgAdmin) {
    return (
      <div className="min-h-screen bg-slate-955 flex flex-col justify-center items-center select-none text-slate-100 relative overflow-hidden">
        <div className="bg-slate-900 border border-slate-850 p-12 rounded-3xl shadow-2xl max-w-md text-center space-y-4 z-10">
          <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-black">Access Denied</h2>
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">
            This administration workspace is restricted to EDUsphere Admins only.
          </p>
          <button
            onClick={() => router.push('/signin')}
            className="w-full py-2.5 bg-slate-855 hover:bg-slate-800 text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none text-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Mail className="w-8 h-8 text-teal-850" />
            Workspace Invitations Tracker
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
            Read-only central command ledger monitoring student, tutor, and administrative workspace invites across EDUsphere.
          </p>
        </div>
        
        <button
          onClick={loadInvitations}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 border hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Invitation Logs
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 border rounded-2xl shadow-3xs flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by workspace, invitee name, or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/20"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Invites</option>
            <option value="ACCEPTED">Accepted Invites</option>
            <option value="EXPIRED">Expired Invites</option>
          </select>
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none"
        >
          <option value="ALL">All Roles</option>
          <option value="TUTOR">Tutor / Teacher</option>
          <option value="STUDENT">Student</option>
        </select>
      </div>

      {/* Invitations Directory Table */}
      <div className="bg-white border rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                <th className="px-6 py-4">Workspace</th>
                <th className="px-6 py-4">Invited User</th>
                <th className="px-6 py-4">Invited Role</th>
                <th className="px-6 py-4">Sent Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs font-bold text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-teal-850" />
                      <span>Syncing invite ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInvitations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-extrabold text-slate-500">No invitations found matching filters</p>
                  </td>
                </tr>
              ) : (
                filteredInvitations.map(inv => {
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-all text-xs text-slate-700">
                      {/* Workspace */}
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                          {inv.workspace}
                        </span>
                      </td>

                      {/* Invited User */}
                      <td className="px-6 py-4">
                        <div>
                          <h4 className="font-extrabold text-slate-800 leading-snug">{inv.invitedUser}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold">{inv.email}</span>
                        </div>
                      </td>

                      {/* Invited Role */}
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-700 font-bold border rounded-lg text-[9px] uppercase tracking-wider">
                          {inv.role}
                        </span>
                      </td>

                      {/* Sent Date */}
                      <td className="px-6 py-4 text-slate-500 font-semibold">
                        <div className="flex items-center gap-1 text-[10px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(inv.sentDate).toLocaleDateString()} at {new Date(inv.sentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {inv.status === 'ACCEPTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 text-[9px] font-black uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" /> Accepted
                          </span>
                        )}
                        {inv.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 text-[9px] font-black uppercase tracking-wider">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                        {inv.status === 'EXPIRED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-600 text-[9px] font-black uppercase tracking-wider">
                            <AlertTriangle className="w-3 h-3" /> Expired
                          </span>
                        )}
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
  );
}
