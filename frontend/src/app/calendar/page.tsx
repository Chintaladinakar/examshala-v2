'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ClipboardList, FileText, Megaphone, RefreshCw, PartyPopper, Plus, X, Trash2 } from 'lucide-react';

type CalendarEvent = {
  id: string;
  type: 'assignment_due' | 'exam' | 'announcement' | 'custom';
  title: string;
  date: string;
  classId?: string;
  className?: string;
  eventType?: string;
  description?: string | null;
};

const TYPE_META: Record<string, { icon: any; color: string }> = {
  assignment_due: { icon: ClipboardList, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  exam: { icon: FileText, color: 'bg-rose-100 text-rose-700 border-rose-200' },
  announcement: { icon: Megaphone, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  custom: { icon: PartyPopper, color: 'bg-teal-100 text-teal-700 border-teal-200' },
};

const CUSTOM_EVENT_TYPES = ['holiday', 'meeting', 'ptm', 'workshop', 'sports', 'other'];

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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

export default function CalendarPage() {
  const { showError, showMessage } = useToast();
  const { user } = useUser();
  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEventType, setFormEventType] = useState('holiday');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');

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

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiJson('/api/calendar', {
        method: 'POST',
        body: JSON.stringify({
          title: formTitle,
          description: formDescription || undefined,
          eventType: formEventType,
          startDate: formStartDate,
          endDate: formEndDate || undefined,
        }),
      });
      showMessage('Event added', 'success');
      setAddModalOpen(false);
      setFormTitle('');
      setFormDescription('');
      setFormStartDate('');
      setFormEndDate('');
      loadEvents();
    } catch (err: any) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await apiJson(`/api/calendar/${eventId}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(e => e.id !== eventId));
      showMessage('Event deleted', 'success');
    } catch (err: any) {
      showError(err);
    }
  };

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
              {isPrincipalMode && (
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md ml-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Event
                </button>
              )}
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
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-extrabold">{e.title}</p>
                          {e.className && <p className="text-[10px] font-bold opacity-70 mt-0.5">{e.className}</p>}
                          {e.description && <p className="text-[10px] font-semibold opacity-70 mt-0.5">{e.description}</p>}
                        </div>
                        {e.type === 'custom' && isPrincipalMode && (
                          <button onClick={() => handleDeleteEvent(e.id)} className="shrink-0 p-1 hover:bg-white/60 rounded-lg cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-5 select-none">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-base font-black text-slate-800">Add Calendar Event</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="space-y-3">
              <input required placeholder="Event title" value={formTitle} onChange={e => setFormTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
              <select value={formEventType} onChange={e => setFormEventType(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35">
                {CUSTOM_EVENT_TYPES.map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Start Date</label>
                  <input required type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">End Date (optional)</label>
                  <input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
                </div>
              </div>
              <textarea
                placeholder="Description (optional)"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35 resize-none"
              />
              <div className="flex gap-2 pt-2 border-t">
                <button type="button" onClick={() => setAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50">
                  {submitting ? 'Saving…' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
