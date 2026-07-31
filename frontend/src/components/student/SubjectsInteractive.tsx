'use client';

import React from 'react';
import { BookOpen, User } from 'lucide-react';
import type { StudentSubject } from '@/lib/student/data';

export function SubjectsInteractive({ subjects }: { subjects: StudentSubject[] }) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-400">Academics</p>
        <h1 className="text-2xl font-bold text-slate-900">My Subjects</h1>
        <p className="text-sm text-slate-500">Subjects offered in your enrolled classes.</p>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs p-10 text-center text-sm text-slate-400">
          No subjects found for your enrolled classes yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s) => (
            <div key={s.id} className="bg-white rounded-3xl border border-slate-100 shadow-3xs p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{s.name}</h3>
                  {s.code && <p className="text-xs text-slate-400">{s.code}</p>}
                </div>
              </div>

              {s.teachers.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Teachers</p>
                  {s.teachers.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {t.name}
                    </div>
                  ))}
                </div>
              )}

              {s.classes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-50">
                  {s.classes.map((c) => (
                    <span key={c.id} className="text-[10px] font-semibold px-2 py-1 rounded-full bg-slate-50 text-slate-500">
                      {c.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
