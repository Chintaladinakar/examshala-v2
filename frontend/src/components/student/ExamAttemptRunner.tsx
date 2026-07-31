"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle, ShieldAlert, Maximize, Lock, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type AttemptQuestion = {
  examQuestionId: string;
  questionId: string;
  marks: number;
  type: string;
  questionText: string;
  options: string[] | null;
  selectedAnswer: any;
  markedForReview: boolean;
};

type AttemptData = {
  attemptId: string;
  exam: { id: string; title: string; durationMinutes: number };
  timeRemainingSeconds: number;
  questions: AttemptQuestion[];
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

export function ExamAttemptRunner({ examId }: { examId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<AttemptData | null>(null);

  const [checklist, setChecklist] = useState({ readInstructions: false, understandRules: false, readyToBegin: false });
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [violationCount, setViolationCount] = useState(0);
  const [securityWarning, setSecurityWarning] = useState({ show: false, message: '' });
  const [fullscreenExitWarning, setFullscreenExitWarning] = useState(false);

  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number | null; totalMarks: number | null; percentage: number | null; status: string } | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    apiJson<AttemptData>(`/api/exams/${examId}/attempt`, { method: 'POST' })
      .then((d) => {
        setData(d);
        setTimeLeft(d.timeRemainingSeconds);
        const initialAnswers: Record<string, any> = {};
        const initialReview: Record<string, boolean> = {};
        for (const q of d.questions) {
          if (q.selectedAnswer !== null && q.selectedAnswer !== undefined) initialAnswers[q.questionId] = q.selectedAnswer;
          if (q.markedForReview) initialReview[q.questionId] = true;
        }
        setAnswers(initialAnswers);
        setMarkedForReview(initialReview);
      })
      .catch((e) => setError(e.message || 'Could not load this exam.'))
      .finally(() => setLoading(false));
  }, [examId]);

  const questions = data?.questions || [];
  const currentQ = questions[currentIndex];

  const autosave = useCallback((patch: { questionId?: string; selectedAnswer?: any; markedForReview?: boolean; timeRemainingSeconds?: number }) => {
    if (!data) return;
    fetch(`/api/exams/attempts/${data.attemptId}/autosave`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).catch(() => {});
  }, [data]);

  const submitAttempt = useCallback(async (autoSubmitted = false) => {
    if (!data || submittingRef.current) return;
    submittingRef.current = true;
    try {
      const res = await apiJson<{ score: number | null; totalMarks: number | null; percentage: number | null; status: string }>(
        `/api/exams/attempts/${data.attemptId}/submit`,
        { method: 'POST', body: JSON.stringify({ autoSubmitted }) }
      );
      setResult(res);
      setIsSubmitted(true);
      setIsConfirmSubmitOpen(false);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (e: any) {
      setError(e.message || 'Failed to submit exam.');
    }
  }, [data]);

  // Timer
  useEffect(() => {
    if (!isExamStarted || isSubmitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next % 10 === 0) autosave({ timeRemainingSeconds: next });
        if (next <= 0) {
          clearInterval(timerRef.current!);
          submitAttempt(true);
          return 0;
        }
        if (next === 600) setSecurityWarning({ show: true, message: '⚠️ 10 minutes remaining!' });
        else if (next === 300) setSecurityWarning({ show: true, message: '⚠️ 5 minutes remaining!' });
        else if (next === 60) setSecurityWarning({ show: true, message: '🚨 1 minute left! Auto-submitting soon.' });
        return next;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isExamStarted, isSubmitted, autosave, submitAttempt]);

  // Anti-cheat listeners
  useEffect(() => {
    if (!isExamStarted || isSubmitted || !data) return;

    const triggerViolation = () => {
      setViolationCount((prev) => {
        const next = prev + 1;
        fetch(`/api/exams/attempts/${data.attemptId}/violation`, { method: 'POST' }).catch(() => {});
        if (next >= 3) {
          submitAttempt(true);
        } else {
          setSecurityWarning({ show: true, message: `🚨 Focus loss detected! Warning ${next} of 3. 3 violations auto-submits your exam.` });
        }
        return next;
      });
    };

    const handleVisibilityChange = () => { if (document.hidden) triggerViolation(); };
    const handleWindowBlur = () => triggerViolation();
    const handleFullscreenChange = () => {
      const isFullscreen = document.fullscreenElement;
      setFullscreenExitWarning(!isFullscreen);
      if (!isFullscreen) triggerViolation();
    };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Your exam is in progress. Leaving may affect your timer.';
      return e.returnValue;
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isExamStarted, isSubmitted, data, submitAttempt]);

  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen may be blocked by the browser; the exam still works without it.
    }
  }

  async function handleStart() {
    setIsExamStarted(true);
    await enterFullscreen();
  }

  function selectAnswer(value: any) {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.questionId]: value }));
    autosave({ questionId: currentQ.questionId, selectedAnswer: value });
  }

  function toggleReview() {
    if (!currentQ) return;
    const next = !markedForReview[currentQ.questionId];
    setMarkedForReview((prev) => ({ ...prev, [currentQ.questionId]: next }));
    autosave({ questionId: currentQ.questionId, markedForReview: next, selectedAnswer: answers[currentQ.questionId] });
  }

  function formatTimer(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const answeredCount = Object.keys(answers).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const unansweredCount = questions.length - answeredCount;
  const isChecklistComplete = checklist.readInstructions && checklist.understandRules && checklist.readyToBegin;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm font-bold text-slate-400">Loading exam...</div>;
  }

  if (error && !isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm text-center space-y-6">
          <h2 className="text-xl font-bold text-slate-800">Unable to load exam</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          <Link href="/studentdashboard/exams" className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Exams
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (isSubmitted) {
    const isPass = result?.percentage !== null && result?.percentage !== undefined && result.percentage >= 40;
    const wasFlagged = violationCount >= 3;
    return (
      <div className="max-w-2xl mx-auto py-8 select-none">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center shadow-md space-y-6">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto border",
            wasFlagged ? "bg-rose-50 text-rose-600 border-rose-100" : isPass ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
          )}>
            {wasFlagged ? <ShieldAlert className="w-8 h-8" /> : <Check className="w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {wasFlagged ? 'Submitted with Security Flags' : 'Exam Submitted'}
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {result?.score === null
              ? 'Your responses have been recorded. Some questions require manual grading, so your final score will appear once your teacher reviews them.'
              : 'Your exam has been graded automatically.'}
          </p>
          {result?.score !== null && (
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wider">Score</span>
                <span className="text-2xl font-black block mt-0.5">{result?.score} <span className="text-xs text-slate-400 font-bold">/ {result?.totalMarks}</span></span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-extrabold text-slate-400 block tracking-wider">Percentage</span>
                <span className="text-2xl font-black block mt-0.5">{result?.percentage}%</span>
              </div>
            </div>
          )}
          <Link href="/studentdashboard/exams" className="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl">
            Return to Exams
          </Link>
        </div>
      </div>
    );
  }

  if (isExamStarted && currentQ) {
    const selected = answers[currentQ.questionId];
    return (
      <div className="fixed inset-0 bg-[#FBFBFB] z-50 overflow-y-auto flex flex-col font-sans text-slate-800">
        {securityWarning.show && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3.5 max-w-md">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <div className="text-xs">
              <h5 className="font-extrabold uppercase tracking-wide">Security Warning</h5>
              <p className="mt-0.5 font-semibold">{securityWarning.message}</p>
            </div>
            <button onClick={() => setSecurityWarning({ show: false, message: '' })} className="font-extrabold uppercase text-[10px] pl-2 shrink-0">Ack</button>
          </div>
        )}

        {fullscreenExitWarning && (
          <div className="fixed inset-0 bg-slate-950/80 z-45 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-3xl max-w-sm text-center border border-rose-100 shadow-2xl space-y-4">
              <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
              <h3 className="text-lg font-black text-slate-900">Fullscreen Required</h3>
              <button onClick={enterFullscreen} className="w-full inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl">
                Restore Fullscreen <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 flex items-center px-4 md:px-8 justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 truncate max-w-[130px] sm:max-w-xs">{data.exam.title}</span>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 border rounded-xl",
            timeLeft < 300 ? "bg-rose-50 border-rose-200 text-rose-700 font-extrabold animate-pulse" : "bg-slate-50 border-slate-200 text-slate-700 font-bold"
          )}>
            <Clock className="w-4 h-4 shrink-0" />
            <span className="text-sm font-mono tracking-wide">{formatTimer(timeLeft)}</span>
          </div>
          <button onClick={() => setIsConfirmSubmitOpen(true)} className="px-4.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl">
            Submit
          </button>
        </header>

        <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col lg:flex-row gap-6">
          <main className="flex-1 flex flex-col justify-between gap-6 min-w-0">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-3xs min-h-[350px] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</span>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/30">+{currentQ.marks} Marks</span>
                </div>
                <h2 className="text-lg md:text-xl font-extrabold text-slate-900 leading-relaxed">{currentQ.questionText}</h2>
              </div>

              <div className="mt-8 space-y-3 flex-1">
                {currentQ.options && currentQ.options.length > 0 ? (
                  currentQ.options.map((opt, i) => {
                    const isSelected = selected === opt;
                    return (
                      <button
                        key={i}
                        onClick={() => selectAnswer(opt)}
                        className={cn(
                          "w-full text-left p-4 rounded-2xl border text-xs md:text-sm font-semibold transition-all flex items-center justify-between group",
                          isSelected ? "bg-teal-500/8 border-teal-600 text-teal-950 font-bold" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <span>{opt}</span>
                        <div className={cn("w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0", isSelected ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300 bg-white")}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3px]" />}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <textarea
                    value={selected || ''}
                    onChange={(e) => selectAnswer(e.target.value)}
                    placeholder="Type your answer..."
                    rows={6}
                    className="w-full p-4 border border-slate-200 rounded-2xl text-sm"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80">
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 text-xs font-bold rounded-xl flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))} disabled={currentIndex === questions.length - 1} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 text-xs font-bold rounded-xl flex items-center gap-1">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={toggleReview}
                className={cn("px-4.5 py-2 border text-xs font-bold rounded-xl", markedForReview[currentQ.questionId] ? "bg-amber-50 border-amber-200 text-amber-800" : "border-slate-200 hover:bg-slate-50 text-slate-600")}
              >
                {markedForReview[currentQ.questionId] ? '★ Marked for Review' : '☆ Mark for Review'}
              </button>
            </div>
          </main>

          <aside className="w-full lg:w-72 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-3xs flex flex-col justify-between shrink-0 min-h-[350px] lg:min-h-0">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-3">Question Palette</h4>
              <div className="grid grid-cols-5 gap-2.5">
                {questions.map((q, idx) => {
                  const isCurrent = currentIndex === idx;
                  const isAnswered = answers[q.questionId] !== undefined;
                  const isMarked = markedForReview[q.questionId];
                  return (
                    <button
                      key={q.questionId}
                      onClick={() => setCurrentIndex(idx)}
                      className={cn(
                        "w-10 h-10 rounded-full font-black text-xs border flex items-center justify-center",
                        isCurrent ? "ring-2 ring-teal-600 border-teal-600 font-extrabold" : "",
                        isMarked ? "bg-amber-500 text-white border-amber-500" : isAnswered ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-50 text-slate-600 border-slate-200"
                      )}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-8 border-t border-slate-50 pt-5 space-y-2.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-emerald-500" /><span>Answered ({answeredCount})</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-amber-500" /><span>Marked ({reviewCount})</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-slate-100 border border-slate-200" /><span>Unanswered ({unansweredCount})</span></div>
            </div>
          </aside>
        </div>

        {isConfirmSubmitOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-6">
              <div className="text-center space-y-2 border-b pb-4">
                <ShieldAlert className="w-10 h-10 text-teal-600 mx-auto" />
                <h3 className="text-lg font-black text-slate-900">Submit Exam?</h3>
                <p className="text-xs text-slate-500">Review your responses before final submission.</p>
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs bg-slate-50 p-4 rounded-xl border border-slate-100 font-extrabold">
                <div><span className="text-[9px] uppercase font-bold text-slate-400 block">Answered</span><span className="text-xl text-emerald-600 font-black block">{answeredCount}</span></div>
                <div><span className="text-[9px] uppercase font-bold text-slate-400 block">Unanswered</span><span className="text-xl text-slate-500 font-black block">{unansweredCount}</span></div>
                <div><span className="text-[9px] uppercase font-bold text-slate-400 block">Review</span><span className="text-xl text-amber-600 font-black block">{reviewCount}</span></div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsConfirmSubmitOpen(false)} className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl">Continue</button>
                <button onClick={() => submitAttempt(false)} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl">Submit Final</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 select-none">
      <Link href="/studentdashboard/exams" className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-slate-400 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Exams
      </Link>
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
          <span className="text-[9px] font-black uppercase tracking-widest text-teal-800 bg-teal-50 border border-teal-200/50 px-2.5 py-0.5 rounded">Live Assessment</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight mt-3 mb-4">{data.exam.title}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-700">Duration: {data.exam.durationMinutes} Minutes · {questions.length} Questions</span>
          </div>
        </div>
        <div className="p-6 md:p-8 space-y-8">
          <div>
            <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Pre-Exam Checklist</h2>
            <div className="space-y-2.5 bg-teal-500/5 p-5 rounded-2xl border border-teal-200/20 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={checklist.readInstructions} onChange={(e) => setChecklist((p) => ({ ...p, readInstructions: e.target.checked }))} className="w-4 h-4" />
                <span>I have read all assessment instructions carefully.</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={checklist.understandRules} onChange={(e) => setChecklist((p) => ({ ...p, understandRules: e.target.checked }))} className="w-4 h-4" />
                <span>I understand the anti-cheat security rules and window monitoring.</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={checklist.readyToBegin} onChange={(e) => setChecklist((p) => ({ ...p, readyToBegin: e.target.checked }))} className="w-4 h-4" />
                <span>I am ready to enter fullscreen and begin my exam.</span>
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end border-t border-slate-100 pt-6">
            <button onClick={handleStart} disabled={!isChecklistComplete} className="inline-flex items-center gap-1.5 px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl disabled:opacity-50">
              Start Exam <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
