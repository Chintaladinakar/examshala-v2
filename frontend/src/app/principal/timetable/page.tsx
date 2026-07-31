'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import { Clock, MapPin, Video, User as UserIcon, Plus, Edit2, Trash2, X, XCircle, RefreshCw, CalendarClock } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

type ClassLite = { id: string; name: string };
type SubjectLite = { id: string; name: string };
type TeacherLite = { id: string; name: string };
type Slot = {
  id: string;
  classId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  meetingUrl: string | null;
  Subject: { id: string; name: string } | null;
  Teacher: { id: string; name: string } | null;
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || 'Server operation failed');
  }
  return body.data as T;
}

export default function PrincipalTimetablePage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();
  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [subjects, setSubjects] = useState<SubjectLite[]>([]);
  const [teachers, setTeachers] = useState<TeacherLite[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Slot | null>(null);
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formDayOfWeek, setFormDayOfWeek] = useState('1');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formRoom, setFormRoom] = useState('');
  const [formMeetingUrl, setFormMeetingUrl] = useState('');

  const today = new Date().getDay();

  const byDay = useMemo(() => {
    const map = new Map<number, Slot[]>();
    for (const s of slots) {
      if (!map.has(s.dayOfWeek)) map.set(s.dayOfWeek, []);
      map.get(s.dayOfWeek)!.push(s);
    }
    for (const list of map.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return map;
  }, [slots]);

  async function loadBaseData() {
    try {
      setLoading(true);
      const [classesData, subjectsData, teachersData] = await Promise.all([
        apiJson<any[]>('/api/classes'),
        apiJson<any[]>('/api/principal/subjects'),
        apiJson<any[]>('/api/principal/teachers'),
      ]);
      const classList = classesData.map(c => ({ id: c.id, name: c.name }));
      setClasses(classList);
      setSubjects(subjectsData.map(s => ({ id: s.id, name: s.name })));
      setTeachers(teachersData.map(t => ({ id: t.id, name: t.name })));
      if (classList.length && !selectedClassId) setSelectedClassId(classList[0].id);
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadSlots(classId: string) {
    if (!classId) return;
    try {
      setLoadingSlots(true);
      const data = await apiJson<Slot[]>(`/api/timetable?classId=${encodeURIComponent(classId)}`);
      setSlots(data);
    } catch (e: any) {
      showError(e);
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    if (isPrincipalMode) loadBaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrincipalMode]);

  useEffect(() => {
    if (selectedClassId) loadSlots(selectedClassId);
  }, [selectedClassId]);

  const resetForm = () => {
    setFormSubjectId('');
    setFormTeacherId('');
    setFormDayOfWeek('1');
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormRoom('');
    setFormMeetingUrl('');
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (slot: Slot) => {
    setEditing(slot);
    setFormSubjectId(slot.Subject?.id || '');
    setFormTeacherId(slot.Teacher?.id || '');
    setFormDayOfWeek(String(slot.dayOfWeek));
    setFormStartTime(slot.startTime);
    setFormEndTime(slot.endTime);
    setFormRoom(slot.room || '');
    setFormMeetingUrl(slot.meetingUrl || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    if (formStartTime >= formEndTime) {
      showError(new Error('End time must be after start time'));
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        classId: selectedClassId,
        subjectId: formSubjectId || undefined,
        teacherId: formTeacherId || undefined,
        dayOfWeek: Number(formDayOfWeek),
        startTime: formStartTime,
        endTime: formEndTime,
        room: formRoom || undefined,
        meetingUrl: formMeetingUrl || undefined,
      };
      if (editing) {
        await apiJson(`/api/timetable/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        showMessage('Slot updated', 'success');
      } else {
        await apiJson('/api/timetable', { method: 'POST', body: JSON.stringify(payload) });
        showMessage('Slot created', 'success');
      }
      setModalOpen(false);
      resetForm();
      loadSlots(selectedClassId);
    } catch (e: any) {
      showError(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (slot: Slot) => {
    if (!confirm('Delete this timetable slot?')) return;
    try {
      await apiJson(`/api/timetable/${slot.id}`, { method: 'DELETE' });
      setSlots(prev => prev.filter(s => s.id !== slot.id));
      showMessage('Slot deleted', 'success');
    } catch (e: any) {
      showError(e);
    }
  };

  if (!isPrincipalMode) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 p-8 flex flex-col justify-center items-center">
          <div className="bg-white border p-12 rounded-3xl shadow-xl max-w-md text-center space-y-4">
            <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-black text-slate-800">Access Denied</h2>
            <p className="text-slate-500 text-sm leading-relaxed">This dashboard is exclusive to Principals.</p>
          </div>
        </main>
      </div>
    );
  }

  const orderedDays = DAY_ORDER.filter(d => byDay.has(d));

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto select-none">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <CalendarClock className="w-8 h-8 text-teal-800" />
                Timetable Management
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Schedule weekly class periods, assign teachers and rooms, and resolve conflicts.
              </p>
            </div>
            <button
              onClick={openCreate}
              disabled={!selectedClassId}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Add Slot
            </button>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 border rounded-2xl shadow-3xs">
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35 min-w-[200px]"
            >
              {loading && <option>Loading classes…</option>}
              {!loading && classes.length === 0 && <option>No classes available</option>}
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              onClick={() => loadSlots(selectedClassId)}
              className="flex items-center gap-1.5 px-3.5 py-2 border hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSlots ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {loadingSlots ? (
            <div className="bg-white border rounded-3xl p-12 text-center text-xs font-bold text-slate-400">Loading timetable…</div>
          ) : slots.length === 0 ? (
            <div className="bg-white border rounded-3xl p-12 text-center text-xs font-bold text-slate-400">
              No slots scheduled for this class yet.
            </div>
          ) : (
            <div className="space-y-5">
              {orderedDays.map(day => (
                <div key={day} className="bg-white border rounded-3xl shadow-3xs overflow-hidden">
                  <div className={`p-4 px-6 border-b ${day === today ? 'bg-teal-50/60' : ''}`}>
                    <h2 className={`font-black text-sm ${day === today ? 'text-teal-700' : 'text-slate-800'}`}>
                      {DAYS[day]} {day === today && <span className="text-[10px] font-bold ml-2">(Today)</span>}
                    </h2>
                  </div>
                  <div className="divide-y">
                    {byDay.get(day)!.map(slot => (
                      <div key={slot.id} className="p-4 px-6 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 text-xs font-black text-slate-700 w-32 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {slot.startTime}–{slot.endTime}
                        </div>
                        <div className="flex-1 min-w-40">
                          <p className="text-xs font-black text-slate-900">{slot.Subject?.name || 'Class Session'}</p>
                        </div>
                        {slot.Teacher && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                            <UserIcon className="w-3.5 h-3.5" />
                            {slot.Teacher.name}
                          </div>
                        )}
                        {slot.room && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                            <MapPin className="w-3.5 h-3.5" />
                            {slot.room}
                          </div>
                        )}
                        {slot.meetingUrl && (
                          <a href={slot.meetingUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[10px] font-bold text-teal-700 hover:text-teal-900">
                            <Video className="w-3.5 h-3.5" /> Join
                          </a>
                        )}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button onClick={() => openEdit(slot)} className="p-1.5 border rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(slot)} className="p-1.5 border rounded-lg text-rose-500 hover:bg-rose-50 transition-all cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5 select-none max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-base font-black text-slate-800">{editing ? 'Edit Timetable Slot' : 'Add Timetable Slot'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select value={formDayOfWeek} onChange={e => setFormDayOfWeek(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35">
                {DAY_ORDER.map(d => <option key={d} value={d}>{DAYS[d]}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Start Time</label>
                  <input type="time" required value={formStartTime} onChange={e => setFormStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">End Time</label>
                  <input type="time" required value={formEndTime} onChange={e => setFormEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
                </div>
              </div>
              <select value={formSubjectId} onChange={e => setFormSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35">
                <option value="">No Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={formTeacherId} onChange={e => setFormTeacherId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35">
                <option value="">No Teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input placeholder="Room (optional)" value={formRoom} onChange={e => setFormRoom(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
              <input placeholder="Meeting URL (optional)" value={formMeetingUrl} onChange={e => setFormMeetingUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
              <div className="flex gap-2 pt-2 border-t">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50">
                  {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
