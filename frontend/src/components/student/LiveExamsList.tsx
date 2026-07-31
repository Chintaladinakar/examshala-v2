'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Clock, CheckCircle2 } from 'lucide-react';

type LiveExam = {
  id: string;
  title: string;
  examType: string;
  durationMinutes: number;
  Class: { id: string; name: string };
  _count: { examQuestions: number };
  attempts: { id: string; status: string; percentage: number | null }[];
};

export function LiveExamsList() {
  const [exams, setExams] = useState<LiveExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/exams/student/available')
      .then((r) => r.json())
      .then((body) => {
        if (body.success) setExams(body.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || exams.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
      <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
        <FileText className="w-4 h-4 text-teal-700" /> Live Exams
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((exam) => {
          const attempt = exam.attempts[0];
          const isDone = attempt && attempt.status !== 'in_progress';
          return (
            <div key={exam.id} className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3">
              <div>
                <p className="font-extrabold text-sm text-slate-800">{exam.title}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{exam.Class?.name} · {exam.examType.replace('_', ' ')}</p>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {exam.durationMinutes} min · {exam._count.examQuestions} questions
                </p>
              </div>
              {isDone ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  {attempt.percentage !== null ? `Submitted · ${attempt.percentage}%` : 'Submitted · Pending review'}
                </div>
              ) : (
                <Link
                  href={`/studentdashboard/exams/live/${exam.id}`}
                  className="inline-flex items-center justify-center px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl"
                >
                  {attempt ? 'Resume Exam' : 'Start Exam'}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
