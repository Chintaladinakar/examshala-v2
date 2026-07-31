'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ClipboardList, FileText, Megaphone, RefreshCw } from 'lucide-react';

type CalendarEvent = {
  id: string;
  type: 'assignment_due' | 'exam' | 'announcement';
  title: string;
  date: string;
  classId?: string;
  className?: string;
};

const TYPE_META: Record<string, { icon: any; color: string }> = {
  assignment_due: { icon: ClipboardList, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  exam: { icon: FileText, color: 'bg-rose-100 text-rose-700 border-rose-200' },
  announcement: { icon: Megaphone, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

async function apiJson<T>(input: RequestInfo | URL): Promise<T> {
  const res = await fetch(input);
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || body?.message || 'Request failed');
  }
  return body.data as T;
}

export default function CalendarPage() {
  const { showError } = useToast();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  async function loadEvents() {
    try {
      setLoading(true);
      const data = await apiJson<CalendarEvent[]>(`/api/calendar?year=${cursor.year}&month=${cursor.month}`);
      setEvents(data);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    for (const e of events) {
      const d = new Date(e.date);
      if (d.getFullYear() === cursor.year && d.getMonth() + 1 === cursor.month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(e);
      }
    }
    return map;
  }, [events, cursor]);

  const daysInMonth = new Date(cursor.year, cursor.month, 0).getDate();
  const firstWeekday = new Date(cursor.year, cursor.month - 1, 1).getDay();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === cursor.year && today.getMonth() + 1 === cursor.month;

  function goMonth(delta: number) {
    let { year, month } = cursor;
    month += delta;
    if (month < 1) { month = 12; year -= 1; }
    if (month > 12) { month = 1; year += 1; }
    setCursor({ year, month });
    setSelectedDay(null);
  }

  const selectedEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-8 h-8 text-teal-850" />
              Calendar
            </h1>
            <div className="flex items-center gap-2">
              <button onClick={() => goMonth(-1)} className="p-2 border rounded-xl hover:bg-white">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-black text-slate-800 w-40 text-center">
                {MONTH_NAMES[cursor.month - 1]} {cursor.year}
              </span>
              <button onClick={() => goMonth(1)} className="p-2 border rounded-xl hover:bg-white">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={loadEvents} className="flex items-center gap-1.5 px-4 py-2 bg-white border hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs ml-2">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border rounded-3xl shadow-xs p-5">
              {loading ? (
                <div className="py-16 text-center text-xs font-bold text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-teal-800 mx-auto mb-2" />
                  Loading calendar...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-7 gap-1 mb-2 text-[10px] font-black text-slate-400 uppercase text-center">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstWeekday }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dayEvents = eventsByDay[day] || [];
                      const isToday = isCurrentMonth && today.getDate() === day;
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDay(day)}
                          className={`aspect-square rounded-xl border p-1.5 flex flex-col items-start text-left transition-colors ${
                            selectedDay === day ? 'border-teal-700 bg-teal-50' : 'border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`text-[11px] font-black ${isToday ? 'text-teal-700' : 'text-slate-600'}`}>{day}</span>
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {dayEvents.slice(0, 3).map((e) => (
                              <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${TYPE_META[e.type]?.color.split(' ')[0] || 'bg-slate-300'}`} />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="bg-white border rounded-3xl shadow-xs p-5">
              <h3 className="text-sm font-black text-slate-800 mb-3">
                {selectedDay ? `${MONTH_NAMES[cursor.month - 1]} ${selectedDay}` : 'Select a day'}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold py-8 text-center">No events on this day</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((e) => {
                    const meta = TYPE_META[e.type] || TYPE_META.announcement;
                    const Icon = meta.icon;
                    return (
                      <div key={e.id} className={`flex items-start gap-2.5 p-3 rounded-xl border ${meta.color}`}>
                        <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-extrabold">{e.title}</p>
                          {e.className && <p className="text-[10px] font-bold opacity-70 mt-0.5">{e.className}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
