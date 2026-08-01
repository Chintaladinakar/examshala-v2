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
  Trash2,
  X,
  Check,
  Ban,
} from 'lucide-react';

type Question = {
  id: string;
  type: string;
  difficulty: string;
  subject: string;
  chapter?: string | null;
  topic?: string | null;
  tags: string[];
  questionText: string;
  options?: string[] | null;
  correctAnswer?: any;
  explanation?: string | null;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewNote?: string | null;
  CreatedBy?: { id: string; name: string };
};

const REVIEW_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-50 border-amber-200 text-amber-700',
  approved: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  rejected: 'bg-rose-50 border-rose-200 text-rose-700',
};

const TYPES = ['mcq', 'true_false', 'short_answer', 'long_answer', 'coding', 'case_study', 'numerical', 'match', 'ordering'];
const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  hard: 'bg-orange-50 border-orange-200 text-orange-700',
  expert: 'bg-rose-50 border-rose-200 text-rose-700',
};

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

export default function QuestionBankPage() {
  const { showError, showMessage } = useToast();
  const { user } = useUser();
  const isPrincipal = user?.role === 'principal';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: 'mcq',
    difficulty: 'medium',
    subject: '',
    chapter: '',
    topic: '',
    tags: '',
    questionText: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    correctAnswer: '',
    explanation: '',
  });

  async function loadQuestions() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (difficultyFilter) params.set('difficulty', difficultyFilter);
      if (subjectFilter) params.set('subject', subjectFilter);
      if (search) params.set('search', search);
      if (reviewStatusFilter) params.set('reviewStatus', reviewStatusFilter);
      const data = await apiJson<Question[]>(`/api/questions?${params.toString()}`);
      setQuestions(data);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(loadQuestions, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, difficultyFilter, subjectFilter, reviewStatusFilter, search]);

  const filtered = useMemo(() => questions, [questions]);

  async function createQuestion(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const isMcq = form.type === 'mcq';
      await apiJson('/api/questions', {
        method: 'POST',
        body: JSON.stringify({
          type: form.type,
          difficulty: form.difficulty,
          subject: form.subject,
          chapter: form.chapter || undefined,
          topic: form.topic || undefined,
          tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          questionText: form.questionText,
          options: isMcq ? form.options.filter((o) => o.trim() !== '') : undefined,
          correctAnswer: isMcq ? form.options[form.correctOptionIndex] : form.correctAnswer || undefined,
          explanation: form.explanation || undefined,
        }),
      });
      showMessage('Question added to bank', 'success');
      setShowCreate(false);
      setForm({
        type: 'mcq', difficulty: 'medium', subject: '', chapter: '', topic: '', tags: '',
        questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, correctAnswer: '', explanation: '',
      });
      await loadQuestions();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  }

  async function archiveQuestion(id: string) {
    if (!window.confirm('Archive this question? It will be hidden from the bank but preserved for existing exams.')) return;
    try {
      await apiJson(`/api/questions/${id}`, { method: 'DELETE' });
      showMessage('Question archived', 'success');
      await loadQuestions();
    } catch (e) {
      showError(e);
    }
  }

  async function reviewQuestion(id: string, action: 'approve' | 'reject') {
    let reviewNote: string | undefined;
    if (action === 'reject') {
      reviewNote = window.prompt('Optional note for the author on why this was rejected:') || undefined;
    }
    setReviewingId(id);
    try {
      await apiJson(`/api/questions/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ action, reviewNote }),
      });
      showMessage(action === 'approve' ? 'Question approved' : 'Question rejected', 'success');
      await loadQuestions();
    } catch (e) {
      showError(e);
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ClipboardList className="w-8 h-8 text-teal-850" />
                Question Bank
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Build a reusable pool of questions for your exams.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={loadQuestions}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-900 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> New Question
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search question text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <input
              type="text"
              placeholder="Filter by subject..."
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700"
            >
              <option value="">All Types</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700"
            >
              <option value="">All Difficulties</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {isPrincipal && (
              <select
                value={reviewStatusFilter}
                onChange={(e) => setReviewStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700"
              >
                <option value="">All Review Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            )}
          </div>

          <div className="bg-white border rounded-3xl shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-xs font-bold text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-800 mx-auto mb-2" />
                Loading question bank...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-extrabold text-slate-500">No questions found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map((q) => (
                  <div key={q.id} className="p-5 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase ${DIFFICULTY_COLOR[q.difficulty] || ''}`}>
                          {q.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] font-extrabold uppercase">
                          {q.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">{q.subject}{q.chapter ? ` · ${q.chapter}` : ''}</span>
                        {q.reviewStatus !== 'approved' && (
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase ${REVIEW_STATUS_COLOR[q.reviewStatus]}`}>
                            {q.reviewStatus}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-800 font-semibold">{q.questionText}</p>
                      {q.reviewStatus === 'rejected' && q.reviewNote && (
                        <p className="text-xs text-rose-600 font-semibold mt-1">Rejection note: {q.reviewNote}</p>
                      )}
                      {q.options && q.options.length > 0 && (
                        <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
                          {q.options.map((o, i) => (
                            <li key={i} className={`px-2 py-1 rounded-lg border ${o === q.correctAnswer ? 'border-emerald-300 bg-emerald-50 text-emerald-700 font-bold' : 'border-slate-200'}`}>
                              {o}
                            </li>
                          ))}
                        </ul>
                      )}
                      {q.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {q.tags.map((t) => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded-md text-slate-500 font-bold">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isPrincipal && q.reviewStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => reviewQuestion(q.id, 'approve')}
                            disabled={reviewingId === q.id}
                            className="p-2 border rounded-lg hover:bg-emerald-50 text-emerald-600 disabled:opacity-50"
                            title="Approve"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => reviewQuestion(q.id, 'reject')}
                            disabled={reviewingId === q.id}
                            className="p-2 border rounded-lg hover:bg-rose-50 text-rose-600 disabled:opacity-50"
                            title="Reject"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => archiveQuestion(q.id)}
                        className="p-2 border rounded-lg hover:bg-rose-50 text-rose-600"
                        title="Archive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">New Question</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={createQuestion} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Subject</label>
                  <input
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Chapter</label>
                  <input
                    value={form.chapter}
                    onChange={(e) => setForm({ ...form, chapter: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">Question Text</label>
                <textarea
                  required
                  value={form.questionText}
                  onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  rows={3}
                />
              </div>

              {form.type === 'mcq' ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600">Options (select the correct one)</label>
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={form.correctOptionIndex === i}
                        onChange={() => setForm({ ...form, correctOptionIndex: i })}
                      />
                      <input
                        value={opt}
                        placeholder={`Option ${i + 1}`}
                        onChange={(e) => {
                          const options = [...form.options];
                          options[i] = e.target.value;
                          setForm({ ...form, options });
                        }}
                        className="flex-1 px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-600">Correct Answer</label>
                  <input
                    value={form.correctAnswer}
                    onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600">Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                />
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
                  {saving ? 'Saving...' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
