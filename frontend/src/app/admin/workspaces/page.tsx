'use client';

import React, { useState, useEffect } from 'react';
import { fetchJson } from '@/lib/api';

interface Workspace {
  id: string;
  name: string;
  createdBy: string | null;
  principalId: string | null;
  principalName: string;
  userCount: number;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function WorkspacesManagementPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [principals, setPrincipals] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [selectedInitialPrincipal, setSelectedInitialPrincipal] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createErrorMsg, setCreateErrorMsg] = useState<string | null>(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetWorkspace, setTargetWorkspace] = useState<Workspace | null>(null);
  const [selectedPrincipalId, setSelectedPrincipalId] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [assignErrorMsg, setAssignErrorMsg] = useState<string | null>(null);

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

      // Fetch workspaces and principal users concurrently
      const [workspacesRes, principalsRes] = await Promise.all([
        fetchJson<{ success: boolean; data: Workspace[] }>('/api/admin/workspaces', { headers }),
        fetchJson<{ success: boolean; data: User[] }>('/api/admin/users?role=PRINCIPAL', { headers }),
      ]);

      setWorkspaces(workspacesRes.data || []);
      setPrincipals(principalsRes.data || []);
    } catch (err: any) {
      console.error('Failed to load workspaces page data:', err);
      setError(err.message || 'Failed to sync workspace directory database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      setSubmittingCreate(true);
      setCreateErrorMsg(null);
      const token = getCookie('session_token');

      const body: any = {
        name: newWorkspaceName.trim(),
      };
      if (selectedInitialPrincipal) {
        body.principalId = selectedInitialPrincipal;
      }

      await fetchJson('/api/admin/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      setNewWorkspaceName('');
      setSelectedInitialPrincipal('');
      setCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      setCreateErrorMsg(err.message || 'Failed to establish workspace node.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleAssignPrincipal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWorkspace || !selectedPrincipalId) return;

    try {
      setSubmittingAssign(true);
      setAssignErrorMsg(null);
      const token = getCookie('session_token');

      await fetchJson(`/api/admin/workspaces/${targetWorkspace.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ principalId: selectedPrincipalId }),
      });

      setSelectedPrincipalId('');
      setTargetWorkspace(null);
      setAssignModalOpen(false);
      loadData();
    } catch (err: any) {
      setAssignErrorMsg(err.message || 'Failed to delegate administrative principal.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  const [editPrincipalId, setEditPrincipalId] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);

  // Deleting State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenEditModal = (ws: Workspace) => {
    setEditingWorkspace(ws);
    setEditWorkspaceName(ws.name || '');
    setEditPrincipalId(ws.principalId || '');
    setEditErrorMsg(null);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkspace) return;

    try {
      setSubmittingEdit(true);
      setEditErrorMsg(null);
      const token = getCookie('session_token');

      await fetchJson(`/api/admin/workspaces/${editingWorkspace.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editWorkspaceName.trim(),
          principalId: editPrincipalId || null,
        }),
      });

      setEditModalOpen(false);
      setEditingWorkspace(null);
      loadData();
    } catch (err: any) {
      setEditErrorMsg(err.message || 'Failed to update workspace details.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteWorkspace = async (ws: Workspace) => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete workspace "${ws.name}"? This will delete all classrooms, student enrollment profiles, teachers, classes, grades, and associated logs in this workspace. This action is extremely destructive and cannot be undone.`);
    if (!confirmDelete) return;

    try {
      setDeletingId(ws.id);
      const token = getCookie('session_token');

      await fetchJson(`/api/admin/workspaces/${ws.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setWorkspaces(prev => prev.filter(w => w.id !== ws.id));
    } catch (err: any) {
      alert(`Failed to delete workspace: ${err.message || 'Request failed'}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Tenant Workspaces</h2>
          <p className="text-slate-500 mt-1">Configure individual academic/workspace tenants, assign principals, and track user volume.</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-teal-950 hover:bg-teal-900 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm shrink-0 border border-teal-850"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Workspace
        </button>
      </div>

      {/* Main Grid View */}
      {loading && workspaces.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-4 animate-pulse">
          <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-2xl">🏢</div>
          <div className="text-sm font-semibold">Loading tenant workspaces directory...</div>
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
      ) : workspaces.length === 0 ? (
        <div className="p-16 text-center text-slate-400 space-y-2 bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
          <span className="text-3xl block">🏢</span>
          <h3 className="font-bold text-slate-700">No active workspaces</h3>
          <p className="text-xs max-w-xs mx-auto">Create a workspace node to begin provisioning workspaces for schools or colleges.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map(ws => {
            const creationDate = new Date(ws.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={ws.id}
                className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] p-6 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Icon and Name */}
                  <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100/80 text-teal-850 flex items-center justify-center text-xl font-bold shrink-0">
                      🏫
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base leading-tight">{ws.name}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 uppercase tracking-wide">
                        ID: {ws.id.substring(0, 8)}...
                      </span>
                    </div>
                  </div>

                  {/* Attributes */}
                  <div className="space-y-3 pt-3 border-t border-slate-50">
                    {/* Principal Info */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-450 font-medium">Assigned Principal</span>
                      {ws.principalId ? (
                        <div className="flex items-center gap-1.5 font-bold text-indigo-750 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-650 animate-pulse"></span>
                          {ws.principalName}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-semibold italic bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                          Unassigned
                        </span>
                      )}
                    </div>

                    {/* Member counts */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-450 font-medium">Total Registered Members</span>
                      <span className="font-bold text-slate-700 bg-slate-50 border border-slate-100/80 px-2.5 py-0.5 rounded-lg">
                        {ws.userCount} {ws.userCount === 1 ? 'user' : 'users'}
                      </span>
                    </div>

                    {/* Established date */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-450 font-medium">Provisioned</span>
                      <span className="text-slate-500 font-semibold">{creationDate}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-1.5 justify-between">
                  <button
                    onClick={() => {
                      setTargetWorkspace(ws);
                      setSelectedPrincipalId(ws.principalId || '');
                      setAssignModalOpen(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-650 hover:text-slate-800 font-semibold rounded-xl text-xs transition-all"
                    title={ws.principalId ? 'Reassign Principal' : 'Assign Principal'}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Principal
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(ws)}
                    className="inline-flex items-center justify-center p-2 border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-slate-500 hover:text-teal-700 font-semibold rounded-xl text-xs transition-all"
                    title="Edit Workspace"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDeleteWorkspace(ws)}
                    disabled={deletingId === ws.id}
                    className="inline-flex items-center justify-center p-2 border border-slate-200 hover:border-rose-500 hover:bg-rose-50 text-slate-500 hover:text-rose-700 font-semibold rounded-xl text-xs transition-all disabled:opacity-50"
                    title="Delete Workspace"
                  >
                    {deletingId === ws.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-rose-600 rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Workspace Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-teal-950/40 backdrop-blur-sm" onClick={() => setCreateModalOpen(false)} />

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 md:p-8 relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
              </svg>
            </button>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Provision Tenant Workspace</h3>
                <p className="text-xs text-slate-500 mt-1">Registers a new academic tenant workspace in the central database.</p>
              </div>

              {createErrorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold px-4 py-3 rounded-xl">
                  ⚠️ {createErrorMsg}
                </div>
              )}

              <form onSubmit={handleCreateWorkspace} className="space-y-4 pt-2">
                {/* Workspace Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Workspace Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Greenwood International High School"
                    value={newWorkspaceName}
                    onChange={e => setNewWorkspaceName(e.target.value)}
                    className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
                  />
                </div>

                {/* Optional Principal assignment */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Assign Principal <span className="text-slate-400 lowercase italic">(optional)</span>
                  </label>
                  <select
                    value={selectedInitialPrincipal}
                    onChange={e => setSelectedInitialPrincipal(e.target.value)}
                    className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
                  >
                    <option value="">Do not assign principal yet</option>
                    {principals.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submission buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCreate}
                    className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {submittingCreate ? 'Creating...' : 'Create Tenant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Principal Modal */}
      {assignModalOpen && targetWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-teal-950/40 backdrop-blur-sm" onClick={() => {
            setAssignModalOpen(false);
            setTargetWorkspace(null);
          }} />

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 md:p-8 relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setAssignModalOpen(false);
                setTargetWorkspace(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
              </svg>
            </button>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Assign Workspace Principal</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Designate a user as principal head of <strong className="text-slate-700">{targetWorkspace.name}</strong>.
                </p>
              </div>

              {assignErrorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold px-4 py-3 rounded-xl">
                  ⚠️ {assignErrorMsg}
                </div>
              )}

              <form onSubmit={handleAssignPrincipal} className="space-y-4 pt-2">
                {/* Select Principal */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Select Principal Account</label>
                  <select
                    required
                    value={selectedPrincipalId}
                    onChange={e => setSelectedPrincipalId(e.target.value)}
                    className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
                  >
                    <option value="">-- Choose principal --</option>
                    {principals.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Only users explicitly created or invited with the `PRINCIPAL` role are listed here.
                  </p>
                </div>

                {/* Submission buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignModalOpen(false);
                      setTargetWorkspace(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAssign || !selectedPrincipalId}
                    className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {submittingAssign ? 'Assigning...' : 'Assign Principal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Edit Workspace Modal */}
      {editModalOpen && editingWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-teal-950/40 backdrop-blur-sm" onClick={() => {
            setEditModalOpen(false);
            setEditingWorkspace(null);
          }} />

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 md:p-8 relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setEditingWorkspace(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l18 18" />
              </svg>
            </button>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Modify Tenant Workspace</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Updates name and administrative parameters for <strong className="text-slate-700">{editingWorkspace.name}</strong>.
                </p>
              </div>

              {editErrorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold px-4 py-3 rounded-xl">
                  ⚠️ {editErrorMsg}
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
                {/* Workspace Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Workspace Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Greenwood International High School"
                    value={editWorkspaceName}
                    onChange={e => setEditWorkspaceName(e.target.value)}
                    className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
                  />
                </div>

                {/* Assigned Principal */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Assigned Principal</label>
                  <select
                    value={editPrincipalId}
                    onChange={e => setEditPrincipalId(e.target.value)}
                    className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
                  >
                    <option value="">No principal assigned</option>
                    {principals.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submission buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      setEditingWorkspace(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit || !editWorkspaceName.trim()}
                    className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {submittingEdit ? 'Saving...' : 'Save Changes'}
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
