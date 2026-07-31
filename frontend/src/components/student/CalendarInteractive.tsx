'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { ChevronLeft, ChevronRight, ClipboardList, FileWarning, Megaphone } from 'lucide-react';
import { useRouter } from 'next/navigation';

type CalendarEvent = {
  id: string;
  type: 'assignment_due' | 'exam' | 'announcement';
  title: string;
  date: string;
  classId?: string;
  className?: string;
};

const typeConfig: Record<CalendarEvent['type'], { label: string; icon: typeof ClipboardList; color: string }> = {
  assignment_due: { label: 'Assignment', icon: FileWarning, color: 'bg-amber-50 text-amber-600' },
  exam: { label: 'Exam', icon: ClipboardList, color: 'bg-indigo-50 text-indigo-600' },
  announcement: { label: 'Announcement', icon: Megaphone, color: 'bg-teal-50 text-teal-600' },
};

export function CalendarInteractive({
  initialEvents,
  year,
  month,
}: {
  initialEvents: CalendarEvent[];
  year: number;
  month: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const monthLabel = useMemo(
    () => new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    [year, month]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    for (const e of initialEvents) {
      const d = new Date(e.date).getDate();
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(e);
    }
    return map;
  }, [initialEvents]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();

  const navigate = (deltaMonths: number) => {
    let newMonth = month + deltaMonths;
    let newYear = year;
    if (newMonth < 1) { newMonth = 12; newYear -= 1; }
    if (newMonth > 12) { newMonth = 1; newYear += 1; }
    startTransition(() => {
      router.push(`/studentdashboard/calendar?year=${newYear}&month=${newMonth}`);
    });
  };

  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">Academics</p>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            disabled={isPending}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-800 min-w-32 text-center">{monthLabel}</span>
          <button
            onClick={() => navigate(1)}
            disabled={isPending}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-50 text-xs font-semibold text-slate-400 uppercase">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="p-3 text-center">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => (
            <div key={idx} className="min-h-24 border-b border-r border-slate-50 p-2 last:border-r-0">
              {day && (
                <>
                  <p className="text-xs font-medium text-slate-500 mb-1">{day}</p>
                  <div className="space-y-1">
                    {(eventsByDay.get(day) || []).slice(0, 3).map((e) => {
                      const cfg = typeConfig[e.type];
                      return (
                        <div key={e.id} className={`text-[10px] px-1.5 py-0.5 rounded-md truncate ${cfg.color}`} title={e.title}>
                          {e.title}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h2 className="font-semibold text-slate-900">Agenda</h2>
        </div>
        {initialEvents.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No events this month.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {initialEvents.map((e) => {
              const cfg = typeConfig[e.type];
              const Icon = cfg.icon;
              return (
                <div key={e.id} className="p-4 px-6 flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{e.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(e.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      {e.className ? ` · ${e.className}` : ''}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
