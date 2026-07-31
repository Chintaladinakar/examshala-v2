'use client';

import React from 'react';
import { Clock, MapPin, Video, User } from 'lucide-react';
import type { StudentTimetableSlot } from '@/lib/student/data';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TimetableInteractive({ slots }: { slots: StudentTimetableSlot[] }) {
  const today = new Date().getDay();

  const byDay = new Map<number, StudentTimetableSlot[]>();
  for (const s of slots) {
    if (!byDay.has(s.dayOfWeek)) byDay.set(s.dayOfWeek, []);
    byDay.get(s.dayOfWeek)!.push(s);
  }

  const orderedDays = [1, 2, 3, 4, 5, 6, 0].filter((d) => byDay.has(d));

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-400">Academics</p>
        <h1 className="text-2xl font-bold text-slate-900">Timetable</h1>
        <p className="text-sm text-slate-500">Your weekly class schedule.</p>
      </div>

      {slots.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs p-10 text-center text-sm text-slate-400">
          No timetable published yet for your classes.
        </div>
      ) : (
        <div className="space-y-6">
          {orderedDays.map((day) => (
            <div key={day} className="bg-white rounded-3xl border border-slate-100 shadow-3xs overflow-hidden">
              <div className={`p-4 px-6 border-b border-slate-50 ${day === today ? 'bg-teal-50/60' : ''}`}>
                <h2 className={`font-semibold ${day === today ? 'text-teal-700' : 'text-slate-900'}`}>
                  {DAYS[day]} {day === today && <span className="text-xs font-medium ml-2">(Today)</span>}
                </h2>
              </div>
              <div className="divide-y divide-slate-50">
                {byDay.get(day)!.map((slot) => (
                  <div key={slot.id} className="p-4 px-6 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 w-32 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {slot.startTime}–{slot.endTime}
                    </div>
                    <div className="flex-1 min-w-40">
                      <p className="text-sm font-medium text-slate-900">{slot.Subject?.name || 'Class Session'}</p>
                      <p className="text-xs text-slate-500">{slot.Class?.name}</p>
                    </div>
                    {slot.Teacher && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <User className="w-3.5 h-3.5" />
                        {slot.Teacher.name}
                      </div>
                    )}
                    {slot.room && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        {slot.room}
                      </div>
                    )}
                    {slot.meetingUrl && (
                      <a
                        href={slot.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Join
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
