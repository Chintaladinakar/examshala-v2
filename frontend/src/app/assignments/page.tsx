'use client';

import React, { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { fetchJson } from '@/lib/api';
import Link from 'next/link';

interface Feedback {
  id: string;
  comment: string;
  createdAt: string;
  Creator: { name: string; role: string };
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  createdAt: string;
  createdRole: string;
  Class: { id: string; name: string };
  Creator: { id: string; name: string };
  feedbacks: Feedback[];
}

interface Classroom { id: string; name: string; }
interface UserProfile { id: string; name: string; role: string; mode: string | null; workspaceName: string; }

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [classId, setClassId] = useState('');
  const [resourceLink, setResourceLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Feedback state
  const [feedbackTexts, setFeedbackTexts] = useState<Record<string, string>>({});
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<Record<string, boolean>>({});

  // Filter state
  const [filterClass, setFilterClass] = useState('');
  const [filterSort, setFilterSort] = useState<'newest' | 'due'>('newest');

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
      const token = getCookie('session_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, assignmentsRes, classesRes] = await Promise.all([
        fetchJson<{ success: boolean; data: UserProfile }>('/api/school/profile', { headers }),
        fetchJson<{ success: boolean; data: Assignment[] }>('/api/school/assignments', { headers }),
        fetchJson<{ success: boolean; data: Classroom[] }>('/api/school/classes', { headers }),
      ]);

      if (profileRes.success) setProfile(profileRes.data);
      if (assignmentsRes.success && assignmentsRes.data) setAssignments(assignmentsRes.data);
      if (classesRes.success && classesRes.data) {
        setClasses(classesRes.data);
        if (classesRes.data.length > 0) setClassId(classesRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const isPrincipal = profile?.role.toLowerCase() === 'principal';
  const isPrincipalMode = isPrincipal && (profile?.mode === 'principal' || profile?.mode === null);
  const isTeacherMode = profile?.role.toLowerCase() === 'teacher' || (isPrincipal && profile?.mode === 'teacher');

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !dueDate || !classId) return;
    try {
      setSubmitting(true);
      setFormError(null);
      setFormSuccess(null);
      const token = getCookie('session_token');
      await fetchJson('/api/school/assignments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, dueDate, classId, resourceLink: resourceLink || undefined }),
      });
      setFormSuccess(`Assignment "${title}" created successfully!`);
      setTitle(''); setDescription(''); setDueDate(''); setResourceLink('');
      await loadData();
      setTimeout(() => { setAddModalOpen(false); setFormSuccess(null); }, 1400);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFeedback = async (assignmentId: string) => {
    const comment = feedbackTexts[assignmentId];
    if (!comment?.trim()) return;
    try {
      setFeedbackSubmitting(prev => ({ ...prev, [assignmentId]: true }));
      const token = getCookie('session_token');
      await fetchJson(`/api/school/assignments/${assignmentId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment }),
      });
      setFeedbackTexts(prev => ({ ...prev, [assignmentId]: '' }));
      await loadData();
    } catch (err: any) {
      alert(`Feedback failed: ${err.message || 'Request failed'}`);
    } finally {
      setFeedbackSubmitting(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const filteredAssignments = assignments
    .filter(a => !filterClass || a.Class.id === filterClass)
    .sort((a, b) => {
      if (filterSort === 'due') return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const isDueSoon = (dueDate: string) => {
    const diff = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 3;
  };
  const isOverdue = (dueDate: string) => new Date(dueDate).getTime() < Date.now();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm transition-colors">Dashboard</Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600 text-sm font-semibold">Assignments</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Assignments</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isPrincipalMode
                ? 'Review all assignments and leave advisory feedback.'
                : 'Create and manage classroom assignments.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isPrincipalMode && (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                🔒 View & Feedback Only (Principal Mode)
              </span>
            )}
            {isTeacherMode && (
              <button
                onClick={() => setAddModalOpen(true)}
                className="inline-flex items-center gap-2 bg-teal-900 hover:bg-teal-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm cursor-pointer"
              >
                <span className="text-base">+</span> Create Assignment
              </button>
            )}
          </div>
        </div>

        <div className="p-8 max-w-6xl mx-auto space-y-6">

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter by Class</span>
              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-800"
              >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort</span>
              <div className="flex rounded-xl overflow-hidden border border-slate-200">
                <button onClick={() => setFilterSort('newest')} className={`px-3.5 py-1.5 text-xs font-semibold transition-all ${filterSort === 'newest' ? 'bg-teal-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                  Newest
                </button>
                <button onClick={() => setFilterSort('due')} className={`px-3.5 py-1.5 text-xs font-semibold border-l border-slate-200 transition-all ${filterSort === 'due' ? 'bg-teal-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                  Due Date
                </button>
              </div>
            </div>
          </div>

          {/* Assignments List */}
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 h-44 p-6" />
              ))}
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-16 text-center space-y-3">
              <span className="text-4xl block">📝</span>
              <h3 className="font-bold text-slate-700">No assignments yet</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">
                {isTeacherMode ? 'Create your first assignment using the button above.' : 'Assignments will appear here once created by teachers.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map(ass => {
                const isExpanded = expandedId === ass.id;
                const overdue = isOverdue(ass.dueDate);
                const dueSoon = isDueSoon(ass.dueDate);

                return (
                  <div
                    key={ass.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {/* Assignment Header */}
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : ass.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-slate-800">{ass.title}</h3>
                            {overdue && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">OVERDUE</span>
                            )}
                            {!overdue && dueSoon && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">DUE SOON</span>
                            )}
                            {ass.feedbacks.length > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                                💬 {ass.feedbacks.length} Feedback
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-100 px-2.5 py-0.5 rounded-full">
                              🏫 {ass.Class.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              by {ass.Creator.name} · {ass.createdRole === 'principal-teacher-mode' ? 'Principal (Teacher Mode)' : 'Teacher'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Due</div>
                            <div className={`text-sm font-bold mt-0.5 ${overdue ? 'text-rose-600' : dueSoon ? 'text-amber-600' : 'text-slate-700'}`}>
                              {new Date(ass.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                          <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Section */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 p-6 space-y-6">
                        {/* Description */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Description</span>
                          <p className="text-slate-600 text-sm leading-relaxed">{ass.description}</p>
                        </div>

                        {/* Feedbacks */}
                        <div className="space-y-3">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            Feedback & Comments ({ass.feedbacks.length})
                          </span>
                          {ass.feedbacks.length > 0 ? (
                            <div className="space-y-3 pl-4 border-l-2 border-violet-200">
                              {ass.feedbacks.map(f => (
                                <div key={f.id} className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-800">{f.Creator.name}</span>
                                    <span className="text-[9px] font-bold text-violet-800 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
                                      {f.Creator.role.toUpperCase()}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {new Date(f.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-600 italic">"{f.comment}"</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400 italic">No feedback yet.</p>
                          )}

                          {/* Add feedback — Principal mode only */}
                          {isPrincipalMode && (
                            <div className="flex gap-3 max-w-2xl pt-2">
                              <input
                                type="text"
                                placeholder="Add your advisory feedback..."
                                value={feedbackTexts[ass.id] || ''}
                                onChange={e => setFeedbackTexts(prev => ({ ...prev, [ass.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && handleAddFeedback(ass.id)}
                                className="flex-1 bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all text-sm"
                              />
                              <button
                                onClick={() => handleAddFeedback(ass.id)}
                                disabled={feedbackSubmitting[ass.id] || !feedbackTexts[ass.id]?.trim()}
                                className="bg-violet-700 hover:bg-violet-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                              >
                                {feedbackSubmitting[ass.id] ? 'Posting...' : '+ Feedback'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create Assignment Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setAddModalOpen(false)} />
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-8 relative z-10">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-all cursor-pointer text-lg"
            >
              ✕
            </button>

            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Create Assignment</h3>
                <p className="text-sm text-slate-500 mt-1">Draft a new homework assignment for your classroom.</p>
              </div>

              {formSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold px-4 py-3 rounded-xl">
                  🎉 {formSuccess}
                </div>
              )}
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold px-4 py-3 rounded-xl">
                  ⚠️ {formError}
                </div>
              )}

              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Assignment Title *</label>
                  <input
                    type="text" required placeholder="e.g. Chapter 4 Chemistry Review"
                    value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-700 transition-all text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Classroom *</label>
                  <select
                    required value={classId} onChange={e => setClassId(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-700 transition-all text-sm"
                  >
                    <option value="">Select Classroom...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Description *</label>
                  <textarea
                    required rows={3} placeholder="Write detailed instructions for students..."
                    value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-700 transition-all text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Due Date *</label>
                    <input
                      type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)}
                      className="w-full bg-slate-50 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-700 transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Resource Link <span className="text-slate-400 lowercase font-normal">(optional)</span></label>
                    <input
                      type="url" placeholder="https://..." value={resourceLink} onChange={e => setResourceLink(e.target.value)}
                      className="w-full bg-slate-50 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-800/20 focus:border-teal-700 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button" onClick={() => setAddModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-teal-900 hover:bg-teal-800 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Creating...' : 'Create Assignment'}
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
