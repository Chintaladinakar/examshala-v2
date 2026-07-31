'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import {
  ClipboardList,
  Plus,
  Search,
  RefreshCw,
  FolderOpen,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  ListChecks,
  ShieldAlert,
} from 'lucide-react';

type ClassLite = { id: string; name: string };
type Assignment = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  subject?: string | null;
  marks?: number | null;
  status?: string | null;
  Class: { id: string; name: string };
  submissionCount: number;
  reviewedCount: number;
  pendingReviewCount: number;
};
type SubmissionRow = {
  studentId: string;
  name: string;
  email: string;
  isMissing: boolean;
  submission: {
    id: string;
    fileUrl?: string;
    textSubmission?: string | null;
    marksObtained?: number | null;
    status: string;
    feedbackComment?: string | null;
    submittedAt: string;
    plagiarismStatus?: string;
  } | null;
};
type RubricCriterion = { id: string; title: string; maxPoints: number; order: number };
type Rubric = { id: string; title: string; criteria: RubricCriterion[] } | null;

const PLAGIARISM_OPTIONS = ['not_checked', 'pending', 'checked', 'flagged'];

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || body?.message || 'Request failed');
  }
  return body.data as T;
}

export default function AssignmentsPage() {
  const { showError, showMessage } = useToast();
  useUser();

  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ title: '', description: '', dueDate: '', classId: '', subject: '', marks: '' });

  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradeDraft, setGradeDraft] = useState<Record<string, { marks: string; comment: string }>>({});

  const [rubric, setRubric] = useState<Rubric>(null);
  const [showRubricEditor, setShowRubricEditor] = useState(false);
  const [rubricForm, setRubricForm] = useState<{ title: string; criteria: { title: string; maxPoints: string }[] }>({
    title: '',
    criteria: [{ title: '', maxPoints: '10' }],
  });
  const [savingRubric, setSavingRubric] = useState(false);

  const [rubricScoringFor, setRubricScoringFor] = useState<string | null>(null);
  const [rubricScoreDraft, setRubricScoreDraft] = useState<Record<string, { points: string; comment: string }>>({});

  async function loadClasses() {
    try {
      const data = await apiJson<ClassLite[]>('/api/classes');
      setClasses(data);
      if (data.length > 0) setForm((f) => ({ ...f, classId: f.classId || data[0].id }));
    } catch (e) {
      showError(e);
    }
  }

  async function loadAssignments() {
    try {
      setLoading(true);
      const qs = classFilter ? `?classId=${encodeURIComponent(classFilter)}` : '';
      const data = await apiJson<Assignment[]>(`/api/assignments${qs}`);
      setAssignments(data);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter]);

  const filtered = useMemo(
    () => assignments.filter((a) => a.title.toLowerCase().includes(search.toLowerCase())),
    [assignments, search]
  );

  async function createAssignment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiJson('/api/assignments', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          dueDate: form.dueDate,
          classId: form.classId,
          subject: form.subject || undefined,
          marks: form.marks ? Number(form.marks) : undefined,
        }),
      });
      showMessage('Assignment created', 'success');
      setShowCreate(false);
      setForm({ title: '', description: '', dueDate: '', classId: classes[0]?.id || '', subject: '', marks: '' });
      await loadAssignments();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  }

  async function deleteAssignment(id: string) {
    if (!window.confirm('Delete this assignment? This cannot be undone.')) return;
    try {
      await apiJson(`/api/assignments/${id}`, { method: 'DELETE' });
      showMessage('Assignment deleted', 'success');
      await loadAssignments();
    } catch (e) {
      showError(e);
    }
  }

  async function openSubmissions(a: Assignment) {
    setActiveAssignment(a);
    setLoadingSubmissions(true);
    try {
      const [data, rubricData] = await Promise.all([
        apiJson<{ submissions: SubmissionRow[] }>(`/api/assignments/${a.id}/submissions`),
        apiJson<Rubric>(`/api/assignments/${a.id}/rubric`).catch(() => null),
      ]);
      setSubmissions(data.submissions);
      setRubric(rubricData);
      const drafts: Record<string, { marks: string; comment: string }> = {};
      for (const row of data.submissions) {
        if (row.submission) {
          drafts[row.submission.id] = {
            marks: row.submission.marksObtained?.toString() ?? '',
            comment: row.submission.feedbackComment ?? '',
          };
        }
      }
      setGradeDraft(drafts);
    } catch (e) {
      showError(e);
    } finally {
      setLoadingSubmissions(false);
    }
  }

  function addRubricCriterion() {
    setRubricForm((f) => ({ ...f, criteria: [...f.criteria, { title: '', maxPoints: '10' }] }));
  }

  function removeRubricCriterion(index: number) {
    setRubricForm((f) => ({ ...f, criteria: f.criteria.filter((_, i) => i !== index) }));
  }

  async function saveRubric(e: React.FormEvent) {
    e.preventDefault();
    if (!activeAssignment) return;
    setSavingRubric(true);
    try {
      const criteria = rubricForm.criteria
        .filter((c) => c.title.trim())
        .map((c) => ({ title: c.title.trim(), maxPoints: Number(c.maxPoints) || 0 }));
      await apiJson(`/api/assignments/${activeAssignment.id}/rubric`, {
        method: 'PUT',
        body: JSON.stringify({ title: rubricForm.title, criteria }),
      });
      showMessage('Rubric saved', 'success');
      setShowRubricEditor(false);
      await openSubmissions(activeAssignment);
    } catch (e) {
      showError(e);
    } finally {
      setSavingRubric(false);
    }
  }

  function openRubricScoring(row: SubmissionRow) {
    if (!row.submission || !rubric) return;
    setRubricScoringFor(row.submission.id);
    const drafts: Record<string, { points: string; comment: string }> = {};
    for (const c of rubric.criteria) drafts[c.id] = { points: '', comment: '' };
    setRubricScoreDraft(drafts);
  }

  async function saveRubricScore() {
    if (!rubricScoringFor || !rubric || !activeAssignment) return;
    try {
      const scores = rubric.criteria
        .filter((c) => rubricScoreDraft[c.id]?.points !== '')
        .map((c) => ({ criterionId: c.id, points: Number(rubricScoreDraft[c.id].points), comment: rubricScoreDraft[c.id].comment || undefined }));
      if (scores.length === 0) {
        showError(new Error('Enter at least one criterion score.'));
        return;
      }
      await apiJson(`/api/assignments/submissions/${rubricScoringFor}/rubric-score`, {
        method: 'PATCH',
        body: JSON.stringify({ scores }),
      });
      showMessage('Rubric score saved', 'success');
      setRubricScoringFor(null);
      await openSubmissions(activeAssignment);
    } catch (e) {
      showError(e);
    }
  }

  async function updatePlagiarismStatus(submissionId: string, plagiarismStatus: string) {
    try {
      await apiJson(`/api/assignments/submissions/${submissionId}/plagiarism`, {
        method: 'PATCH',
        body: JSON.stringify({ plagiarismStatus }),
      });
      showMessage('Plagiarism status updated', 'success');
      if (activeAssignment) await openSubmissions(activeAssignment);
    } catch (e) {
      showError(e);
    }
  }

  async function saveGrade(submissionId: string) {
    const draft = gradeDraft[submissionId];
    try {
      await apiJson(`/api/assignments/submissions/${submissionId}/grade`, {
        method: 'PATCH',
        body: JSON.stringify({
          marksObtained: draft?.marks ? Number(draft.marks) : undefined,
          feedbackComment: draft?.comment || undefined,
        }),
      });
      showMessage('Submission graded', 'success');
      if (activeAssignment) await openSubmissions(activeAssignment);
    } catch (e) {
      showError(e);
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {!activeAssignment ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <ClipboardList className="w-8 h-8 text-teal-850" />
                    Assignments
                  </h1>
                  <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                    Create, manage, and grade assignments for your classes.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700"
                  >
                    <option value="">All Classes</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={loadAssignments}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                  <button
                    onClick={() => setShowCreate(true)}
                    disabled={classes.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-900 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Assignment
                  </button>
                </div>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search assignments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div className="bg-white border rounded-3xl shadow-xs overflow-hidden">
                {loading ? (
                  <div className="py-16 text-center text-xs font-bold text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-teal-800 mx-auto mb-2" />
                    Loading assignments...
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-16 text-center">
                    <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-extrabold text-slate-500">No assignments found</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Class</th>
                        <th className="px-6 py-4">Due Date</th>
                        <th className="px-6 py-4">Submissions</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/50 text-xs text-slate-700">
                          <td className="px-6 py-4">
                            <div className="font-extrabold text-slate-800">{a.title}</div>
                            {a.subject && <div className="text-[10px] text-slate-400 mt-0.5">{a.subject}</div>}
                          </td>
                          <td className="px-6 py-4">{a.Class?.name}</td>
                          <td className="px-6 py-4">{new Date(a.dueDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => openSubmissions(a)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold uppercase"
                            >
                              {a.submissionCount} submitted · {a.pendingReviewCount} pending
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => deleteAssignment(a.id)}
                              className="p-2 border rounded-lg hover:bg-rose-50 text-rose-600"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveAssignment(null)}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-lg font-black text-slate-800">{activeAssignment.title}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                      {activeAssignment.Class?.name} · Grading roster
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setRubricForm(
                      rubric
                        ? { title: rubric.title, criteria: rubric.criteria.map((c) => ({ title: c.title, maxPoints: String(c.maxPoints) })) }
                        : { title: '', criteria: [{ title: '', maxPoints: '10' }] }
                    );
                    setShowRubricEditor(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs"
                >
                  <ListChecks className="w-3.5 h-3.5" /> {rubric ? 'Edit Rubric' : 'Add Rubric'}
                </button>
              </div>

              <div className="bg-white border rounded-3xl shadow-xs overflow-hidden">
                {loadingSubmissions ? (
                  <div className="py-16 text-center text-xs font-bold text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-teal-800 mx-auto mb-2" />
                    Loading submissions...
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Marks</th>
                        <th className="px-6 py-4">Feedback</th>
                        <th className="px-6 py-4">Plagiarism</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {submissions.map((row) => (
                        <tr key={row.studentId} className="text-xs text-slate-700">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">{row.name}</div>
                            <div className="text-[10px] text-slate-400">{row.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            {!row.submission ? (
                              row.isMissing ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-extrabold uppercase">
                                  Missing
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border text-slate-500 text-[9px] font-extrabold uppercase">
                                  Not Submitted
                                </span>
                              )
                            ) : row.submission.status === 'reviewed' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-extrabold uppercase">
                                <CheckCircle2 className="w-3 h-3" /> Reviewed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-extrabold uppercase">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {row.submission ? (
                              <input
                                type="number"
                                min={0}
                                max={activeAssignment.marks || undefined}
                                value={gradeDraft[row.submission.id]?.marks ?? ''}
                                onChange={(e) =>
                                  setGradeDraft((d) => ({
                                    ...d,
                                    [row.submission!.id]: { ...d[row.submission!.id], marks: e.target.value, comment: d[row.submission!.id]?.comment ?? '' },
                                  }))
                                }
                                className="w-20 px-2 py-1 border rounded-lg text-xs"
                              />
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {row.submission ? (
                              <input
                                type="text"
                                placeholder="Add feedback..."
                                value={gradeDraft[row.submission.id]?.comment ?? ''}
                                onChange={(e) =>
                                  setGradeDraft((d) => ({
                                    ...d,
                                    [row.submission!.id]: { ...d[row.submission!.id], comment: e.target.value, marks: d[row.submission!.id]?.marks ?? '' },
                                  }))
                                }
                                className="w-48 px-2 py-1 border rounded-lg text-xs"
                              />
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {row.submission ? (
                              <select
                                value={row.submission.plagiarismStatus || 'not_checked'}
                                onChange={(e) => updatePlagiarismStatus(row.submission!.id, e.target.value)}
                                className={`px-2 py-1 border rounded-lg text-[10px] font-bold uppercase ${
                                  row.submission.plagiarismStatus === 'flagged' ? 'border-rose-300 bg-rose-50 text-rose-700' : ''
                                }`}
                              >
                                {PLAGIARISM_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt.replace('_', ' ')}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              '—'
                            )}
                            {row.submission?.plagiarismStatus === 'flagged' && (
                              <ShieldAlert className="inline w-3.5 h-3.5 text-rose-600 ml-1.5" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {row.submission && (
                              <div className="inline-flex items-center gap-1.5">
                                {rubric && (
                                  <button
                                    onClick={() => openRubricScoring(row)}
                                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[10px] rounded-lg"
                                  >
                                    Rubric
                                  </button>
                                )}
                                <button
                                  onClick={() => saveGrade(row.submission!.id)}
                                  className="px-3 py-1.5 bg-teal-900 hover:bg-teal-800 text-white font-bold text-[10px] rounded-lg"
                                >
                                  Save
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">New Assignment</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={createAssignment} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">Class</label>
                <select
                  required
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Description</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Due Date</label>
                  <input
                    required
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Subject</label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Max Marks</label>
                  <input
                    type="number"
                    min={0}
                    value={form.marks}
                    onChange={(e) => setForm({ ...form, marks: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-teal-900 hover:bg-teal-800 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRubricEditor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">Grading Rubric</h3>
              <button onClick={() => setShowRubricEditor(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={saveRubric} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">Rubric Title</label>
                <input
                  required
                  value={rubricForm.title}
                  onChange={(e) => setRubricForm({ ...rubricForm, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600">Criteria</label>
                {rubricForm.criteria.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      required
                      placeholder="Criterion (e.g. Clarity)"
                      value={c.title}
                      onChange={(e) => {
                        const criteria = [...rubricForm.criteria];
                        criteria[i] = { ...criteria[i], title: e.target.value };
                        setRubricForm({ ...rubricForm, criteria });
                      }}
                      className="flex-1 px-3 py-2 border rounded-xl text-sm"
                    />
                    <input
                      required
                      type="number"
                      min={1}
                      placeholder="Points"
                      value={c.maxPoints}
                      onChange={(e) => {
                        const criteria = [...rubricForm.criteria];
                        criteria[i] = { ...criteria[i], maxPoints: e.target.value };
                        setRubricForm({ ...rubricForm, criteria });
                      }}
                      className="w-24 px-3 py-2 border rounded-xl text-sm"
                    />
                    <button type="button" onClick={() => removeRubricCriterion(i)} className="p-2 border rounded-lg hover:bg-rose-50 text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addRubricCriterion} className="text-xs font-bold text-teal-700 hover:underline">
                  + Add Criterion
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowRubricEditor(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600">
                  Cancel
                </button>
                <button type="submit" disabled={savingRubric} className="px-4 py-2 bg-teal-900 hover:bg-teal-800 text-white rounded-xl text-xs font-bold disabled:opacity-50">
                  {savingRubric ? 'Saving...' : 'Save Rubric'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {rubricScoringFor && rubric && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">Score: {rubric.title}</h3>
              <button onClick={() => setRubricScoringFor(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {rubric.criteria.map((c) => (
                <div key={c.id} className="border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700">{c.title}</span>
                    <span className="text-[10px] text-slate-400 font-bold">max {c.maxPoints}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={c.maxPoints}
                      value={rubricScoreDraft[c.id]?.points ?? ''}
                      onChange={(e) => setRubricScoreDraft((d) => ({ ...d, [c.id]: { ...d[c.id], points: e.target.value } }))}
                      className="w-20 px-2 py-1.5 border rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Comment (optional)"
                      value={rubricScoreDraft[c.id]?.comment ?? ''}
                      onChange={(e) => setRubricScoreDraft((d) => ({ ...d, [c.id]: { ...d[c.id], comment: e.target.value } }))}
                      className="flex-1 px-2 py-1.5 border rounded-lg text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setRubricScoringFor(null)} className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600">
                Cancel
              </button>
              <button onClick={saveRubricScore} className="px-4 py-2 bg-teal-900 hover:bg-teal-800 text-white rounded-xl text-xs font-bold">
                Save Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
