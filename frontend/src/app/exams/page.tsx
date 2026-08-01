'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import {
  FileText,
  Plus,
  RefreshCw,
  FolderOpen,
  ArrowLeft,
  Trash2,
  Send,
  Archive,
  Trophy,
  X,
  Check,
  Ban,
} from 'lucide-react';

type ClassLite = { id: string; name: string };
type Question = { id: string; questionText: string; type: string; difficulty: string; subject: string };
type Exam = {
  id: string;
  title: string;
  examType: string;
  status: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewNote?: string | null;
  durationMinutes: number;
  Class: { id: string; name: string };
  _count: { examQuestions: number; attempts: number };
};

const REVIEW_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-50 border-amber-200 text-amber-700',
  approved: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  rejected: 'bg-rose-50 border-rose-200 text-rose-700',
};
type LeaderboardRow = { rank: number; studentId: string; name: string; score: number | null; totalMarks: number | null; percentage: number | null };

const EXAM_TYPES = ['quiz', 'class_test', 'unit_test', 'practice', 'mock', 'final'];

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

export default function ExamsPage() {
  const { showError, showMessage } = useToast();
  const { user } = useUser();
  const isPrincipal = user?.role === 'principal';

  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', classId: '', examType: 'quiz', subject: '', durationMinutes: '30', passingPercentage: '40',
  });

  const [resultsExamId, setResultsExamId] = useState<string | null>(null);
  const [results, setResults] = useState<{ average: number | null; highest: number | null; lowest: number | null; attemptCount: number; leaderboard: LeaderboardRow[] } | null>(null);

  async function loadClasses() {
    try {
      const data = await apiJson<ClassLite[]>('/api/classes');
      setClasses(data);
      if (data.length > 0) setForm((f) => ({ ...f, classId: f.classId || data[0].id }));
    } catch (e) {
      showError(e);
    }
  }

  async function loadExams() {
    try {
      setLoading(true);
      const data = await apiJson<Exam[]>('/api/exams');
      setExams(data);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadBankQuestions() {
    try {
      const data = await apiJson<Question[]>('/api/questions?limit=100');
      setBankQuestions(data);
    } catch (e) {
      showError(e);
    }
  }

  useEffect(() => {
    loadClasses();
    loadExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setSelectedQuestionIds([]);
    loadBankQuestions();
    setShowCreate(true);
  }

  function toggleQuestion(id: string) {
    setSelectedQuestionIds((prev) => (prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]));
  }

  async function createExam(e: React.FormEvent) {
    e.preventDefault();
    if (selectedQuestionIds.length === 0) {
      showError(new Error('Select at least one question from the bank.'));
      return;
    }
    setSaving(true);
    try {
      await apiJson('/api/exams', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          classId: form.classId,
          examType: form.examType,
          subject: form.subject || undefined,
          durationMinutes: Number(form.durationMinutes),
          passingPercentage: form.passingPercentage ? Number(form.passingPercentage) : undefined,
          questionIds: selectedQuestionIds.map((questionId) => ({ questionId, marks: 1 })),
        }),
      });
      showMessage('Exam created as draft', 'success');
      setShowCreate(false);
      await loadExams();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(exam: Exam, status: string) {
    try {
      await apiJson(`/api/exams/${exam.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      showMessage(`Exam ${status}`, 'success');
      await loadExams();
    } catch (e) {
      showError(e);
    }
  }

  async function reviewExam(exam: Exam, action: 'approve' | 'reject') {
    let reviewNote: string | undefined;
    if (action === 'reject') {
      reviewNote = window.prompt('Optional note for the author on why this was rejected:') || undefined;
    }
    setReviewingId(exam.id);
    try {
      await apiJson(`/api/exams/${exam.id}/review`, { method: 'PATCH', body: JSON.stringify({ action, reviewNote }) });
      showMessage(action === 'approve' ? 'Exam approved' : 'Exam rejected', 'success');
      await loadExams();
    } catch (e) {
      showError(e);
    } finally {
      setReviewingId(null);
    }
  }

  async function deleteExam(id: string) {
    if (!window.confirm('Delete this exam? This cannot be undone.')) return;
    try {
      await apiJson(`/api/exams/${id}`, { method: 'DELETE' });
      showMessage('Exam deleted', 'success');
      await loadExams();
    } catch (e) {
      showError(e);
    }
  }

  async function viewResults(examId: string) {
    setResultsExamId(examId);
    try {
      const data = await apiJson<typeof results>(`/api/exams/${examId}/results`);
      setResults(data);
    } catch (e) {
      showError(e);
    }
  }

  const filteredBank = useMemo(() => bankQuestions.filter((q) => !form.subject || q.subject.toLowerCase() === form.subject.toLowerCase()), [bankQuestions, form.subject]);

  const activeExam = exams.find((e) => e.id === resultsExamId);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {!resultsExamId ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="w-8 h-8 text-teal-850" />
                    Exams
                  </h1>
                  <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                    Build exams from your question bank and track results.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={loadExams}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                  <button
                    onClick={openCreate}
                    disabled={classes.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-900 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Exam
                  </button>
                </div>
              </div>

              <div className="bg-white border rounded-3xl shadow-xs overflow-hidden">
                {loading ? (
                  <div className="py-16 text-center text-xs font-bold text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin text-teal-800 mx-auto mb-2" />
                    Loading exams...
                  </div>
                ) : exams.length === 0 ? (
                  <div className="py-16 text-center">
                    <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-extrabold text-slate-500">No exams created yet</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Class</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Questions / Attempts</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {exams.map((ex) => (
                        <tr key={ex.id} className="hover:bg-slate-50/50 text-xs text-slate-700">
                          <td className="px-6 py-4 font-extrabold text-slate-800">{ex.title}</td>
                          <td className="px-6 py-4">{ex.Class?.name}</td>
                          <td className="px-6 py-4 capitalize">{ex.examType.replace('_', ' ')}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase ${
                                ex.status === 'published'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : ex.status === 'archived'
                                  ? 'bg-slate-100 border-slate-200 text-slate-500'
                                  : 'bg-amber-50 border-amber-200 text-amber-700'
                              }`}
                            >
                              {ex.status}
                            </span>
                            {ex.reviewStatus !== 'approved' && (
                              <span
                                className={`ml-1.5 px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase ${REVIEW_STATUS_COLOR[ex.reviewStatus]}`}
                                title={ex.reviewStatus === 'rejected' && ex.reviewNote ? ex.reviewNote : undefined}
                              >
                                {ex.reviewStatus}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {ex._count.examQuestions} questions · {ex._count.attempts} attempts
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {isPrincipal && ex.reviewStatus === 'pending' && (
                                <>
                                  <button
                                    onClick={() => reviewExam(ex, 'approve')}
                                    disabled={reviewingId === ex.id}
                                    className="p-2 border rounded-lg hover:bg-emerald-50 text-emerald-600 disabled:opacity-50"
                                    title="Approve"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => reviewExam(ex, 'reject')}
                                    disabled={reviewingId === ex.id}
                                    className="p-2 border rounded-lg hover:bg-rose-50 text-rose-600 disabled:opacity-50"
                                    title="Reject"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {ex.status === 'draft' && (
                                <button
                                  onClick={() => setStatus(ex, 'published')}
                                  className="p-2 border rounded-lg hover:bg-emerald-50 text-emerald-600"
                                  title="Publish"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {ex.status === 'published' && (
                                <button
                                  onClick={() => setStatus(ex, 'archived')}
                                  className="p-2 border rounded-lg hover:bg-slate-100 text-slate-600"
                                  title="Archive"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => viewResults(ex.id)}
                                className="p-2 border rounded-lg hover:bg-indigo-50 text-indigo-600"
                                title="Results"
                              >
                                <Trophy className="w-3.5 h-3.5" />
                              </button>
                              {ex._count.attempts === 0 && (
                                <button
                                  onClick={() => deleteExam(ex.id)}
                                  className="p-2 border rounded-lg hover:bg-rose-50 text-rose-600"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
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
              <div className="flex items-center gap-3 pb-4 border-b">
                <button onClick={() => { setResultsExamId(null); setResults(null); }} className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-lg font-black text-slate-800">{activeExam?.title} — Results</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Leaderboard & performance summary</p>
                </div>
              </div>

              {results && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border rounded-2xl p-4">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Attempts</p>
                      <p className="text-xl font-black text-slate-800 mt-1">{results.attemptCount}</p>
                    </div>
                    <div className="bg-white border rounded-2xl p-4">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Average</p>
                      <p className="text-xl font-black text-indigo-600 mt-1">{results.average !== null ? `${results.average.toFixed(1)}%` : '—'}</p>
                    </div>
                    <div className="bg-white border rounded-2xl p-4">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Highest</p>
                      <p className="text-xl font-black text-emerald-600 mt-1">{results.highest !== null ? `${results.highest}%` : '—'}</p>
                    </div>
                    <div className="bg-white border rounded-2xl p-4">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lowest</p>
                      <p className="text-xl font-black text-rose-600 mt-1">{results.lowest !== null ? `${results.lowest}%` : '—'}</p>
                    </div>
                  </div>

                  <div className="bg-white border rounded-3xl shadow-xs overflow-hidden">
                    {results.leaderboard.length === 0 ? (
                      <div className="py-16 text-center text-xs font-extrabold text-slate-500">No submitted attempts yet</div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 border-b text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                            <th className="px-6 py-4">Rank</th>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Score</th>
                            <th className="px-6 py-4">Percentage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {results.leaderboard.map((row) => (
                            <tr key={row.studentId} className="text-xs text-slate-700">
                              <td className="px-6 py-4 font-black">#{row.rank}</td>
                              <td className="px-6 py-4 font-bold text-slate-800">{row.name}</td>
                              <td className="px-6 py-4">{row.score ?? '—'} / {row.totalMarks ?? '—'}</td>
                              <td className="px-6 py-4">{row.percentage !== null ? `${row.percentage}%` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">New Exam</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={createExam} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
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
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Type</label>
                  <select
                    value={form.examType}
                    onChange={(e) => setForm({ ...form, examType: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  >
                    {EXAM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Duration (min)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Passing %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.passingPercentage}
                    onChange={(e) => setForm({ ...form, passingPercentage: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Filter Question Bank by Subject</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">
                  Select Questions ({selectedQuestionIds.length} selected)
                </label>
                <div className="mt-1 border rounded-xl max-h-56 overflow-y-auto divide-y">
                  {filteredBank.length === 0 ? (
                    <p className="p-4 text-xs text-slate-400 text-center">No questions in your bank yet. Add some in Question Bank first.</p>
                  ) : (
                    filteredBank.map((q) => (
                      <label key={q.id} className="flex items-start gap-2 p-3 text-xs cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selectedQuestionIds.includes(q.id)}
                          onChange={() => toggleQuestion(q.id)}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="font-bold text-slate-800">{q.questionText}</span>
                          <span className="block text-slate-400 mt-0.5">{q.subject} · {q.type} · {q.difficulty}</span>
                        </span>
                      </label>
                    ))
                  )}
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
                  {saving ? 'Creating...' : 'Create Draft Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
