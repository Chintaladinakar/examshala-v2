'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import {
  Building2,
  Users,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  X,
  ChevronRight,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Activity,
  BookOpen,
  GraduationCap,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';

type Workspace = {
  id: string;
  name: string;
  principal: string;
  teachersCount: number;
  studentsCount: number;
  createdAt: string;
  status: string; // ACTIVE, SUSPENDED
};

type WorkspaceDetails = {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  principalName: string;
  principalEmail: string;
  principalPhone: string;
  status: string;
  stats: {
    teachers: number;
    students: number;
    classes: number;
    subjects: number;
    exams: number;
    assignments: number;
  };
  activity: {
    id: string;
    action: string;
    user: string;
    timestamp: string;
  }[];
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
    throw new Error(body?.error?.message || 'Admin workspaces request failed');
  }
  return body.data as T;
}

export default function ActiveWorkspacesPage() {
  const { user, loading: profileLoading } = useUser();
  const { showError, showMessage } = useToast();
  const router = useRouter();

  const role = user?.role?.toLowerCase();
  const isSuperAdmin = role === 'superadmin' || role === 'org_admin' || role === 'admin';

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceDetails | null>(null);
  
  // Drawer & Modal control
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [workspaceToSuspend, setWorkspaceToSuspend] = useState<Workspace | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  async function loadWorkspaces() {
    try {
      setLoading(true);
      const res = await apiFetch<Workspace[]>('/api/admin/workspaces');
      setWorkspaces(res);
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isSuperAdmin) {
      loadWorkspaces();
    }
  }, [isSuperAdmin]);

  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter(w => {
      const matchesSearch = 
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.principal.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [workspaces, searchQuery, statusFilter]);

  const handleOpenDetails = async (workspace: Workspace) => {
    try {
      setDrawerLoading(true);
      setDrawerOpen(true);
      const details = await apiFetch<WorkspaceDetails>(`/api/admin/workspaces?id=${workspace.id}`);
      setSelectedWorkspace(details);
    } catch (e: any) {
      showError(e);
      setDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleToggleStatus = async (workspaceId: string, action: 'suspend' | 'activate') => {
    try {
      setActionInProgress(true);
      const res = await apiFetch<any>('/api/admin/workspaces', {
        method: 'PATCH',
        body: JSON.stringify({ workspaceId, action })
      });
      
      showMessage(`Workspace status changed to ${res.status} successfully!`, 'success');
      setSuspendModalOpen(false);
      setWorkspaceToSuspend(null);
      
      // Update drawer details if open
      if (selectedWorkspace && selectedWorkspace.id === workspaceId) {
        setSelectedWorkspace(prev => prev ? { ...prev, status: res.status } : null);
      }

      await loadWorkspaces();
    } catch (e: any) {
      showError(e);
    } finally {
      setActionInProgress(false);
    }
  };

  const openSuspendConfirm = (workspace: Workspace) => {
    setWorkspaceToSuspend(workspace);
    setSuspendModalOpen(true);
  };

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

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center select-none text-slate-100 relative overflow-hidden">
        <div className="bg-slate-900 border border-slate-850 p-12 rounded-3xl shadow-2xl max-w-md text-center space-y-4 z-10">
          <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-black">Access Denied</h2>
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">
            This administration workspace is restricted to EDUsphere Admins only.
          </p>
          <button
            onClick={() => router.push('/signin')}
            className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
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
            <Building2 className="w-8 h-8 text-teal-850" />
            Approved Workspace Hub
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
            Supervise approved institutional workspace networks, review usage aggregates, or suspend/restore node access.
          </p>
        </div>
        
        <button
          onClick={loadWorkspaces}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 border hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Node Registry
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 border rounded-2xl shadow-3xs flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by workspace name or Principal..."
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
            <option value="ACTIVE">Active Nodes</option>
            <option value="SUSPENDED">Suspended Nodes</option>
          </select>
        </div>
      </div>

      {/* Workspace Directory Table */}
      <div className="bg-white border rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                <th className="px-6 py-4">Workspace Name</th>
                <th className="px-6 py-4">Principal (Admin)</th>
                <th className="px-6 py-4">Sizing (St / Te)</th>
                <th className="px-6 py-4">Approved On</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs font-bold text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-teal-850" />
                      <span>Retrieving institutional networks...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredWorkspaces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-extrabold text-slate-500">No approved workspaces match your criteria</p>
                  </td>
                </tr>
              ) : (
                filteredWorkspaces.map(w => {
                  return (
                    <tr key={w.id} className="hover:bg-slate-50/50 transition-all text-xs text-slate-700">
                      {/* Workspace Name */}
                      <td className="px-6 py-4">
                        <div>
                          <h4 className="font-extrabold text-slate-800 leading-snug">{w.name}</h4>
                          <span className="text-[9px] text-slate-400 font-mono select-all">{w.id}</span>
                        </div>
                      </td>

                      {/* Principal */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800">👤 {w.principal}</span>
                      </td>

                      {/* Sizing */}
                      <td className="px-6 py-4 font-semibold text-slate-500">
                        <div className="flex items-center gap-4 text-[10px]">
                          <div>Students: <span className="font-black text-slate-800">{w.studentsCount}</span></div>
                          <div>Teachers: <span className="font-black text-slate-800">{w.teachersCount}</span></div>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 text-slate-500 font-semibold">
                        <div className="flex items-center gap-1 text-[10px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(w.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {w.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 text-[9px] font-black uppercase tracking-wider">
                            ● Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-600 text-[9px] font-black uppercase tracking-wider">
                            ● Suspended
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 ml-auto">
                          <button
                            onClick={() => handleOpenDetails(w)}
                            className="px-3 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-350 text-slate-700 font-bold text-[10px] rounded-xl transition-all cursor-pointer flex items-center gap-1"
                          >
                            View stats <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          
                          {w.status === 'ACTIVE' ? (
                            <button
                              onClick={() => openSuspendConfirm(w)}
                              className="px-3 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 text-rose-500 font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(w.id, 'activate')}
                              className="px-3 py-1.5 border border-emerald-250 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 text-emerald-600 font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                            >
                              Activate
                            </button>
                          )}
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

      {/* ─── WORKSPACE STATISTICS / ACTIVITY SLIDE OUT DRAWER ─────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex justify-end z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between select-none animate-slide-left">
            {drawerLoading || !selectedWorkspace ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-850" />
                <span className="text-xs font-bold text-slate-400">Loading node intelligence...</span>
              </div>
            ) : (
              <div className="space-y-6 flex-1 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-5 h-5 text-teal-850" /> Workspace Information
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Aggregate performance and credentials monitor.</p>
                  </div>
                  <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-slate-800">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Info block */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Institution Details</h4>
                  <div className="space-y-2 bg-slate-50 p-4 border rounded-2xl text-xs text-slate-600">
                    <div className="flex justify-between items-center py-1 border-b">
                      <span className="font-semibold text-slate-400">Workspace Name</span>
                      <span className="font-extrabold text-slate-800">{selectedWorkspace.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b">
                      <span className="font-semibold text-slate-400">Join Code</span>
                      <span className="font-mono font-black text-teal-800 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded text-[10px]">{selectedWorkspace.code}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b">
                      <span className="font-semibold text-slate-400">Principal</span>
                      <span className="font-extrabold text-slate-800">{selectedWorkspace.principalName}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b">
                      <span className="font-semibold text-slate-400">Principal Email</span>
                      <span className="font-extrabold text-slate-800">{selectedWorkspace.principalEmail}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="font-semibold text-slate-400">Status</span>
                      <span>
                        {selectedWorkspace.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[9px] font-black rounded uppercase">Active</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-rose-500/10 text-rose-600 text-[9px] font-black rounded uppercase">Suspended</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sizing Stats */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Workspace Sizing & Resources</h4>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl text-center">
                      <GraduationCap className="w-5 h-5 text-teal-700 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold block">Students</span>
                      <span className="text-base font-black text-slate-800">{selectedWorkspace.stats.students}</span>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl text-center">
                      <Users className="w-5 h-5 text-teal-650 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold block">Teachers</span>
                      <span className="text-base font-black text-slate-800">{selectedWorkspace.stats.teachers}</span>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl text-center">
                      <Building2 className="w-5 h-5 text-teal-800 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold block">Classes</span>
                      <span className="text-base font-black text-slate-800">{selectedWorkspace.stats.classes}</span>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl text-center">
                      <BookOpen className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold block">Subjects</span>
                      <span className="text-base font-black text-slate-800">{selectedWorkspace.stats.subjects}</span>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl text-center">
                      <ClipboardList className="w-5 h-5 text-pink-600 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold block">Exams</span>
                      <span className="text-base font-black text-slate-800">{selectedWorkspace.stats.exams}</span>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-2xl text-center">
                      <Activity className="w-5 h-5 text-sky-600 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold block">Assignments</span>
                      <span className="text-base font-black text-slate-800">{selectedWorkspace.stats.assignments}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Recent Workspace Activity</h4>
                  {selectedWorkspace.activity.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-semibold bg-slate-50 p-4 border rounded-2xl text-center">No recent student/teacher activities logged yet.</p>
                  ) : (
                    <div className="relative border-l border-slate-150 ml-2.5 pl-4 space-y-4">
                      {selectedWorkspace.activity.map(act => (
                        <div key={act.id} className="relative text-[11px] leading-relaxed">
                          <span className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-teal-800 border border-white" />
                          <span className="font-extrabold text-slate-800 block">{act.action}</span>
                          <span className="text-slate-400 block mt-0.5">By {act.user} • {new Date(act.timestamp).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions panel */}
            <div className="pt-4 border-t mt-6">
              {selectedWorkspace && selectedWorkspace.status === 'ACTIVE' ? (
                <button
                  onClick={() => {
                    const ws = workspaces.find(w => w.id === selectedWorkspace.id);
                    if (ws) openSuspendConfirm(ws);
                  }}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <AlertTriangle className="w-4 h-4" /> Suspend Workspace Access
                </button>
              ) : selectedWorkspace ? (
                <button
                  onClick={() => handleToggleStatus(selectedWorkspace.id, 'activate')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <CheckCircle className="w-4 h-4" /> Activate Workspace Access
                </button>
              ) : (
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── SUSPEND WARNING DIALOG MODAL ────────────────────────────────────────── */}
      {suspendModalOpen && workspaceToSuspend && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-2xl p-6 space-y-4 select-none animate-scale-up">
            <div className="flex items-center gap-2.5 pb-2 border-b">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 leading-snug">
                  Suspend Workspace?
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Confirm lockouts for "{workspaceToSuspend.name}"</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-semibold text-slate-500 leading-relaxed bg-slate-50 p-4 border rounded-2xl">
              <span className="text-slate-800 font-extrabold block uppercase tracking-wider text-[10px] mb-1 text-rose-600">🔴 Critical Warning Consequences</span>
              <p>1. <strong>Access Blocked:</strong> All Principal, Tutor, and Student accounts belonging to this workspace will be immediately blocked from logging in.</p>
              <p>2. <strong>Exams Disabled:</strong> Active exams and tests inside this workspace will be automatically hidden and disabled.</p>
              <p>3. <strong>Assignments Disabled:</strong> Tutors and students cannot upload, review, or submit assignment files.</p>
            </div>

            <div className="flex gap-2.5 border-t pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setSuspendModalOpen(false);
                  setWorkspaceToSuspend(null);
                }}
                disabled={actionInProgress}
                className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 font-extrabold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus(workspaceToSuspend.id, 'suspend')}
                disabled={actionInProgress}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {actionInProgress ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...
                  </>
                ) : (
                  'Confirm Suspension'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
