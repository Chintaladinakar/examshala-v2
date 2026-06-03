'use client';

import React, { useEffect, useState, useMemo } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import {
  Megaphone,
  Search,
  Plus,
  Edit3,
  Trash2,
  Sliders,
  CheckCircle2,
  FolderOpen,
  X,
  RefreshCw,
  AlertCircle,
  Calendar,
  Sparkles,
  Archive,
  ArrowUpRight,
  User,
  Users
} from 'lucide-react';

type Announcement = {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  audience: string;
  status: 'Published' | 'Archived';
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
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

export default function PrincipalAnnouncementsPage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();

  const isPrincipalMode =
    (user?.role || '').toLowerCase() === 'principal' &&
    (user?.mode || 'principal') === 'principal';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Archived'>('All');

  // Modals & Forms
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Publish Form State
  const [pubTitle, setPubTitle] = useState('');
  const [pubContent, setPubContent] = useState('');
  const [pubAudience, setPubAudience] = useState<'All Users' | 'Teachers Only' | 'Students Only'>('All Users');
  const [submittingPublish, setSubmittingPublish] = useState(false);

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Action loading state (per item ID)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  async function loadAnnouncements() {
    try {
      setLoading(true);
      const res = await apiJson<Announcement[]>('/api/principal/announcements');
      setAnnouncements(res);
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isPrincipalMode) {
      loadAnnouncements();
    }
  }, [isPrincipalMode]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubTitle.trim() || !pubContent.trim()) return;

    try {
      setSubmittingPublish(true);
      const newAnn = await apiJson<Announcement>('/api/principal/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: pubTitle,
          content: pubContent,
          audience: pubAudience,
        }),
      });

      showMessage('Announcement published successfully', 'success');
      setAnnouncements((prev) => [newAnn, ...prev]);
      setPublishModalOpen(false);
      setPubTitle('');
      setPubContent('');
      setPubAudience('All Users');
    } catch (err: any) {
      showError(err);
    } finally {
      setSubmittingPublish(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnnouncement || !editTitle.trim() || !editContent.trim()) return;

    try {
      setSubmittingEdit(true);
      const updated = await apiJson<Announcement>('/api/principal/announcements', {
        method: 'PATCH',
        body: JSON.stringify({
          id: selectedAnnouncement.id,
          action: 'edit',
          title: editTitle,
          content: editContent,
        }),
      });

      showMessage('Announcement updated successfully', 'success');
      setAnnouncements((prev) =>
        prev.map((ann) =>
          ann.id === selectedAnnouncement.id
            ? { ...ann, title: updated.title, content: updated.content, status: updated.status }
            : ann
        )
      );
      setEditModalOpen(false);
      setSelectedAnnouncement(null);
    } catch (err: any) {
      showError(err);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: 'Published' | 'Archived') => {
    const nextAction = currentStatus === 'Published' ? 'archive' : 'publish';
    try {
      setActionLoadingId(id);
      await apiJson<any>('/api/principal/announcements', {
        method: 'PATCH',
        body: JSON.stringify({ id, action: nextAction }),
      });

      showMessage(
        `Announcement successfully ${nextAction === 'archive' ? 'archived' : 'published'}`,
        'success'
      );
      setAnnouncements((prev) =>
        prev.map((ann) =>
          ann.id === id
            ? { ...ann, status: nextAction === 'archive' ? 'Archived' : 'Published' }
            : ann
        )
      );
    } catch (err: any) {
      showError(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to permanently delete this announcement? This action cannot be undone.');
    if (!confirm) return;

    try {
      setActionLoadingId(id);
      await apiJson<any>(`/api/principal/announcements?id=${id}`, {
        method: 'DELETE',
      });

      showMessage('Announcement deleted successfully', 'success');
      setAnnouncements((prev) => prev.filter((ann) => ann.id !== id));
    } catch (err: any) {
      showError(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const openEditModal = (ann: Announcement) => {
    setSelectedAnnouncement(ann);
    setEditTitle(ann.title);
    setEditContent(ann.content);
    setEditModalOpen(true);
  };

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      const matchesSearch =
        ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || ann.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [announcements, searchQuery, statusFilter]);

  // Quick Stats
  const stats = useMemo(() => {
    const total = announcements.length;
    const active = announcements.filter((ann) => ann.status === 'Published').length;
    const archived = announcements.filter((ann) => ann.status === 'Archived').length;
    return { total, active, archived };
  }, [announcements]);

  if (!isPrincipalMode) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 p-8 flex flex-col justify-center items-center">
          <div className="bg-white border p-12 rounded-3xl shadow-xl max-w-md text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
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
                <Megaphone className="w-8 h-8 text-teal-800" />
                Announcements Board
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Publish workspace-wide bulletins, system notices, and broadcast warnings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadAnnouncements}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-4 py-2 border hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Bulletins
              </button>

              <button
                onClick={() => setPublishModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Publish Notice
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white border p-5 rounded-2xl shadow-3xs flex items-center gap-4">
              <div className="w-10 h-10 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center text-teal-700 font-black">
                📢
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Bulletins</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{stats.total}</p>
              </div>
            </div>

            <div className="bg-white border p-5 rounded-2xl shadow-3xs flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-black">
                🟢
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Announcements</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{stats.active}</p>
              </div>
            </div>

            <div className="bg-white border p-5 rounded-2xl shadow-3xs flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-700 font-black">
                📁
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Archived Notices</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{stats.archived}</p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 border rounded-2xl shadow-3xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search bulletins by title, message, or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700/35 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-xl bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Bulletins</option>
                <option value="Published">Published Only</option>
                <option value="Archived">Archived Only</option>
              </select>
            </div>
          </div>

          {/* Bulletin Feed */}
          {loading ? (
            <div className="bg-white border rounded-3xl p-16 text-center text-xs font-bold text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-teal-800 mx-auto mb-2" />
              Syncing bulletin registry...
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="bg-white border rounded-3xl p-16 text-center select-none">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-black text-slate-700">No Announcements Mapped</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Click "Publish Notice" to broadcast your first academic bulletin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAnnouncements.map((ann) => {
                const isArchived = ann.status === 'Archived';
                const isActionLoading = actionLoadingId === ann.id;

                // Color mapping for audiences
                let audBadge = 'bg-emerald-500/10 border-emerald-200 text-emerald-700';
                if (ann.audience === 'Teachers Only') {
                  audBadge = 'bg-violet-500/10 border-violet-200 text-violet-700';
                } else if (ann.audience === 'Students Only') {
                  audBadge = 'bg-sky-500/10 border-sky-200 text-sky-700';
                }

                return (
                  <div
                    key={ann.id}
                    className={`bg-white border rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                      isArchived ? 'opacity-70 border-dashed bg-slate-50/50' : 'hover:shadow-md border-slate-200/60'
                    }`}
                  >
                    {/* Top Section: Badges & Info */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wide ${audBadge}`}>
                          {ann.audience}
                        </span>

                        <span
                          className={`px-2 py-0.5 border rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                            isArchived
                              ? 'bg-amber-100 border-amber-200 text-amber-800'
                              : 'bg-teal-50 border-teal-100 text-teal-800'
                          }`}
                        >
                          {ann.status}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-slate-800 leading-snug tracking-tight">
                          {ann.title}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(ann.date).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-wrap pt-2 border-t border-slate-100">
                        {ann.content}
                      </div>
                    </div>

                    {/* Bottom Section: Author & Action Buttons */}
                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 mt-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-600">{ann.author}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(ann.id, ann.status)}
                          disabled={isActionLoading}
                          className={`p-1.5 border rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                            isArchived
                              ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                              : 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800'
                          }`}
                          title={isArchived ? 'Publish Bulletin' : 'Archive Bulletin'}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openEditModal(ann)}
                          disabled={isActionLoading}
                          className="p-1.5 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-850 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                          title="Edit Notice"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(ann.id)}
                          disabled={isActionLoading}
                          className="p-1.5 border border-rose-100 bg-rose-50 hover:bg-rose-150 text-rose-600 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ─── PUBLISH NOTICE MODAL ────────────────────────────────────────────── */}
      {publishModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-teal-950 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-400" /> Publish Workspace Announcement
                </h3>
                <p className="text-[10px] text-teal-200 mt-0.5">
                  Broadcast bulletins immediately to workspace user dashboards.
                </p>
              </div>
              <button
                onClick={() => setPublishModalOpen(false)}
                className="text-teal-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Bulletin Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Campus Maintenance Schedule"
                  value={pubTitle}
                  onChange={(e) => setPubTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Target Audience *
                </label>
                <select
                  value={pubAudience}
                  onChange={(e) => setPubAudience(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="All Users">All Users (Students & Faculty)</option>
                  <option value="Teachers Only">Teachers & Tutors Only</option>
                  <option value="Students Only">Students Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Draft your announcement message here..."
                  value={pubContent}
                  onChange={(e) => setPubContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setPublishModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border hover:bg-slate-50 font-extrabold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPublish}
                  className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submittingPublish ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT NOTICE MODAL ────────────────────────────────────────────────── */}
      {editModalOpen && selectedAnnouncement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-teal-950 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-teal-400" /> Edit Notice Content
                </h3>
                <p className="text-[10px] text-teal-200 mt-0.5">
                  Update title or message body details for this notice.
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-teal-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Bulletin Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={5}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedAnnouncement(null);
                  }}
                  className="flex-1 px-4 py-2.5 border hover:bg-slate-50 font-extrabold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
