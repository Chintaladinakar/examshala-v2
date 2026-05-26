'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';

type ClassLite = { id: string; name: string };
type Feedback = { id: string; comment: string; createdAt: string; Creator?: { name: string } };
type AssignmentRow = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  createdAt: string;
  classId: string;
  Class: { name: string };
  Creator: { id: string; name: string };
  feedbacks: Feedback[];
};

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) throw new Error(body?.error?.message || 'Request failed');
  return body.data as T;
}

export default function AssignmentsPage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();

  const role = (user?.role || '').toLowerCase();
  const mode = (user?.mode || 'principal').toLowerCase();
  const isTeacherMode = role === 'teacher' || (role === 'principal' && mode === 'teacher');
  const isPrincipalMode = role === 'principal' && mode === 'principal';

  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterClassId, setFilterClassId] = useState('');
  const filtered = useMemo(() => assignments.filter(a => (!filterClassId ? true : a.classId === filterClassId)), [assignments, filterClassId]);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [attachLink, setAttachLink] = useState('');
  const [classId, setClassId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [assData, classData] = await Promise.all([
        apiJson<AssignmentRow[]>('/api/assignments', { method: 'GET' }),
        apiJson<any[]>('/api/classes', { method: 'GET' }),
      ]);
      setAssignments(assData);
      const cls = classData.map(c => ({ id: c.id, name: c.name }));
      setClasses(cls);
      if (!classId && cls[0]) setClassId(cls[0].id);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!isTeacherMode) return;
    try {
      setSubmitting(true);
      const created = await apiJson('/api/assignments', {
        method: 'POST',
        body: JSON.stringify({ title, description, dueDate, classId, attachLink: attachLink || undefined }),
      });
      showMessage('Assignment created', 'success');
      setCreateOpen(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      setAttachLink('');
      await load();
      return created;
    } catch (e2) {
      showError(e2);
    } finally {
      setSubmitting(false);
    }
  }

  async function addFeedback(assignmentId: string, comment: string) {
    if (!isPrincipalMode) return;
    try {
      const feedback = await apiJson(`/api/assignments/${assignmentId}/feedback`, { method: 'POST', body: JSON.stringify({ comment }) });
      showMessage('Feedback added', 'success');
      setAssignments(prev =>
        prev.map(a => (a.id === assignmentId ? { ...a, feedbacks: [{ ...(feedback as any), Creator: { name: user?.name || 'Principal' } }, ...a.feedbacks] } : a))
      );
    } catch (e) {
      showError(e);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
              <p className="text-sm text-slate-600">
                {isTeacherMode ? 'Create assignments for your classes' : 'View assignments and add feedback'}
              </p>
            </div>
            {isTeacherMode && (
              <button onClick={() => setCreateOpen(true)} className="px-4 py-2 rounded-xl bg-teal-950 text-white font-semibold text-sm hover:bg-teal-900">
                Create Assignment
              </button>
            )}
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            <select value={filterClassId} onChange={e => setFilterClassId(e.target.value)} className="px-3 py-2 border rounded-xl bg-white">
              <option value="">All classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button onClick={load} className="px-3 py-2 border rounded-xl bg-white text-sm font-semibold">
              Refresh
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-slate-500">Loading...</div>
            ) : filtered.length ? (
              filtered.map(a => (
                <div key={a.id} className="bg-white border rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-bold text-slate-900">{a.title}</div>
                      <div className="text-sm text-slate-600">
                        Class: {a.Class?.name} • Due: {new Date(a.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">Created by {a.Creator?.name}</div>
                  </div>
                  {a.description && <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 border rounded-xl p-3">{a.description}</pre>}

                  <div className="border-t pt-3 space-y-2">
                    <div className="text-xs font-bold text-slate-600">Feedback</div>
                    {isPrincipalMode && <FeedbackBox onSubmit={c => addFeedback(a.id, c)} />}
                    {a.feedbacks?.length ? (
                      <div className="space-y-2">
                        {a.feedbacks.map(f => (
                          <div key={f.id} className="text-sm text-slate-700 border rounded-xl p-3 bg-white">
                            <div className="text-xs text-slate-500 mb-1">
                              {f.Creator?.name || 'Principal'} • {new Date(f.createdAt).toLocaleString()}
                            </div>
                            <div>{f.comment}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">No feedback yet</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-500">No assignments</div>
            )}
          </div>
        </div>

        {createOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-lg rounded-2xl border shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Create assignment</h2>
                <button onClick={() => setCreateOpen(false)} className="text-slate-500 hover:text-slate-800">
                  ✕
                </button>
              </div>
              <form onSubmit={createAssignment} className="space-y-3">
                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full px-3 py-2 border rounded-xl" />
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full px-3 py-2 border rounded-xl min-h-24" />
                <div className="grid md:grid-cols-2 gap-3">
                  <input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                  <select required value={classId} onChange={e => setClassId(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-white">
                    <option value="">Select class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input value={attachLink} onChange={e => setAttachLink(e.target.value)} placeholder="Attach link (optional)" className="w-full px-3 py-2 border rounded-xl" />
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 px-3 py-2 rounded-xl border font-semibold">
                    Cancel
                  </button>
                  <button disabled={submitting} className="flex-1 px-3 py-2 rounded-xl bg-teal-950 text-white font-semibold disabled:opacity-50">
                    {submitting ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function FeedbackBox({ onSubmit }: { onSubmit: (comment: string) => Promise<void> }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = comment.trim();
    if (!c) return;
    try {
      setSubmitting(true);
      await onSubmit(c);
      setComment('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add feedback..." className="flex-1 px-3 py-2 border rounded-xl" />
      <button disabled={submitting} className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-sm disabled:opacity-50">
        {submitting ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
}

