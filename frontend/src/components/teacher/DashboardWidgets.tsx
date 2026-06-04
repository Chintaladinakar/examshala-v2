'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  Plus,
  BookOpen,
  Award,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  MessageSquare,
  FileText,
  Percent,
  Check,
  X,
  Volume2,
  ArrowUpRight
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

// ─── Stat Card ───────────────────────────────────────────────────────────────
export function StatCard({ title, value, icon: Icon, isHighlighted }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  isHighlighted?: boolean;
}) {
  return (
    <div className={`group relative p-6 rounded-3xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
      isHighlighted
        ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/[0.02] to-white border-amber-300/60 shadow-xs ring-1 ring-amber-500/15'
        : 'bg-white border-slate-100 shadow-3xs'
    }`}>
      {/* Glow Backing for Highlighted Cards */}
      {isHighlighted && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      )}

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            isHighlighted ? 'text-amber-800' : 'text-slate-400'
          }`}>
            {title}
          </span>
          <div className="text-3xl font-black text-slate-800 tracking-tight transition-colors group-hover:text-slate-900">
            {value}
          </div>
        </div>

        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-300 shrink-0 group-hover:scale-110 ${
          isHighlighted
            ? 'bg-amber-500/10 text-amber-600 border-amber-500/25 group-hover:bg-amber-500 group-hover:text-white'
            : 'bg-indigo-50/50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Decorative indicator lines */}
      <div className="flex items-center justify-between mt-5 pt-1.5 border-t border-slate-50">
        <span className="text-[10px] text-slate-400">Registry status</span>
        <div className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isHighlighted ? 'bg-amber-500 animate-pulse' : 'bg-teal-400'}`} />
          <span className="text-[10px] text-slate-500 font-semibold">{isHighlighted ? 'Requires Action' : 'Synced'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Pending Grading Card ───────────────────────────────────────────────────
export function PendingGradingCard({ items, onReview }: {
  items: { id: string; name: string; type: string; class: string; pendingCount: number }[];
  onReview?: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5 select-none">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500 animate-pulse" /> Pending Grading
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">Evaluations awaiting teacher review</p>
        </div>
      </div>

      <div className="flex-1 space-y-3.5">
        {items.length === 0 ? (
          <EmptyState title="All caught up!" subtitle="No papers or assignments pending evaluation." icon={CheckCircle2} />
        ) : (
          items.map((item) => (
            <div key={item.id} className="group relative border border-slate-100 hover:border-amber-200/50 hover:shadow-xs p-4 bg-slate-50/50 hover:bg-amber-50/[0.08] rounded-2xl transition-all duration-200 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase border bg-amber-50 text-amber-800 border-amber-100">
                  {item.type}
                </span>
                <h3 className="font-bold text-slate-800 text-sm mt-1.5 truncate group-hover:text-amber-950">
                  {item.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Class: {item.class}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-xs font-black text-amber-600 block">{item.pendingCount} Pending</span>
                  <span className="text-[9px] text-slate-400">submissions</span>
                </div>
                <button
                  onClick={() => onReview?.(item.id)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs hover:shadow-sm cursor-pointer transition-all duration-150 shrink-0"
                >
                  Review
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Upcoming Classes Card ──────────────────────────────────────────────────
export function UpcomingClassesCard({ timetable }: {
  timetable: { id: string; className: string; subject: string; startTime: string; endTime: string }[];
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5 select-none">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" /> Upcoming Classes
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">Today's scheduled lectures</p>
        </div>
      </div>

      <div className="flex-1 space-y-3.5">
        {timetable.length === 0 ? (
          <EmptyState title="No Scheduled Classes" subtitle="You have no scheduled classes today." icon={Calendar} />
        ) : (
          timetable.map((c) => (
            <div key={c.id} className="flex items-start gap-4 p-4 border border-slate-50 bg-slate-50/30 rounded-2xl hover:bg-slate-50/80 transition-colors">
              {/* Timing */}
              <div className="bg-indigo-50 text-indigo-700 font-extrabold text-[10px] tracking-wide px-2.5 py-1.5 rounded-xl text-center min-w-[76px] shrink-0 border border-indigo-100">
                {c.startTime}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-800 text-sm truncate leading-snug">{c.subject}</h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">Class: {c.className}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Ends at {c.endTime}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Announcements Card ─────────────────────────────────────────────────────
export function AnnouncementsCard({ announcements, isPrincipal, onPublish }: {
  announcements: { id: string; title: string; message: string; actionUrl: string; createdAt: string }[];
  isPrincipal: boolean;
  onPublish?: (data: { title: string; message: string }) => Promise<void>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { showError, showMessage } = useToast();

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    try {
      setLoading(true);
      if (onPublish) {
        await onPublish({ title, message });
        showMessage('Announcement created successfully', 'success');
        setTitle('');
        setMessage('');
        setModalOpen(false);
      }
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs p-6 flex flex-col relative">
      <div className="flex items-center justify-between mb-5 select-none">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-teal-500 animate-bounce" /> Recent Announcements
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">Workspace announcements & bulletin</p>
        </div>
        {isPrincipal && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Post Announcement
          </button>
        )}
      </div>

      <div className="flex-1 space-y-4">
        {announcements.length === 0 ? (
          <EmptyState title="All Quiet" subtitle="No bulletins or announcements have been posted yet." icon={Volume2} />
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="p-4 border-l-4 border-teal-500 bg-slate-50/40 rounded-r-2xl hover:bg-slate-50/80 transition-colors">
              <h3 className="font-extrabold text-slate-800 text-sm">{a.title}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{a.message}</p>
              <div className="flex items-center justify-between mt-3 text-[10px] font-semibold text-slate-400 select-none">
                <span>By: <span className="text-slate-600 font-bold">{a.actionUrl || 'Principal'}</span></span>
                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dynamic inline Announcement Modal (Principals only) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 w-full max-w-md animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-teal-600" /> Create Announcement
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Announcement Title</label>
                <input
                  type="text"
                  placeholder="e.g. Science Fair Postponed"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message Content</label>
                <textarea
                  placeholder="Type bulletin contents here..."
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 text-slate-700 font-extrabold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs shadow-sm hover:shadow cursor-pointer transition-all disabled:opacity-50"
                >
                  {loading ? 'Publishing…' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Attendance Summary Donut Widget ─────────────────────────────────────────
export function AttendanceSummaryCard({ stats }: {
  stats: { present: number; absent: number; late: number };
}) {
  const total = stats.present + stats.absent + stats.late;
  const presentPct = total > 0 ? Math.round((stats.present / total) * 100) : 0;
  const absentPct = total > 0 ? Math.round((stats.absent / total) * 100) : 0;
  const latePct = total > 0 ? Math.round((stats.late / total) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5 select-none">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" /> Attendance Registry
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">Today's attendance analytics</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6">
        {/* Ring Chart Summary */}
        <div className="flex items-center gap-5">
          {/* Custom SVG Ring Gauge */}
          <div className="w-20 h-20 flex items-center justify-center shrink-0 relative">
            <svg className="w-20 h-20 text-teal-600" viewBox="0 0 36 36">
              <path className="text-slate-100" strokeWidth="4.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-emerald-500" strokeDasharray={`${presentPct}, 100`} strokeWidth="4.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black text-slate-800 leading-none">{presentPct}%</span>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Ratio</span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Present
              </span>
              <span className="text-slate-800 font-black">{stats.present} <span className="text-[10px] text-slate-400 font-normal">({presentPct}%)</span></span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Absent
              </span>
              <span className="text-slate-800 font-black">{stats.absent} <span className="text-[10px] text-slate-400 font-normal">({absentPct}%)</span></span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Late
              </span>
              <span className="text-slate-800 font-black">{stats.late} <span className="text-[10px] text-slate-400 font-normal">({latePct}%)</span></span>
            </div>
          </div>
        </div>

        {/* Action triggers */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
          <button className="py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-[11px] rounded-xl cursor-pointer transition-colors border border-slate-200/50">
            View Report
          </button>
          <button className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl cursor-pointer shadow-2xs hover:shadow-sm transition-all">
            Mark Attendance
          </button>
        </div>
      </div>
    </div>
  );
}



// ─── Calendar Widget ────────────────────────────────────────────────────────
export function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(new Date().getDate());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Derive days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
  };

  // Events indicator database mapping dates (simulated for simplicity & visuals)
  const scheduledItems = useMemo(() => {
    const itemsMap: Record<number, { type: 'exam' | 'assignment' | 'event'; title: string; time: string }[]> = {
      4: [{ type: 'exam', title: 'Math Unit Test', time: '09:00 - 10:30' }],
      12: [{ type: 'assignment', title: 'Physics Homework Due', time: 'Before 23:59' }],
      18: [{ type: 'event', title: 'Summer Sports Day', time: '08:30 - 14:00' }],
      25: [{ type: 'exam', title: 'History Mid-Term Paper', time: '11:00 - 13:00' }],
    };
    return itemsMap;
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4 select-none">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" /> Interactive Planner
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">Exams, due dates & bulletins</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-black text-slate-800 min-w-[80px] text-center select-none">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-bold text-slate-400 border-b border-slate-50 pb-2 mb-2 select-none">
        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
      </div>

      <div className="grid grid-cols-7 gap-y-1.5 text-center text-xs relative select-none">
        {/* Fill offset blanks */}
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <span key={`empty-${idx}`} className="w-8 h-8 inline-block" />
        ))}

        {/* Days grid */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const isSelected = selectedDate === dayNum;
          const items = scheduledItems[dayNum] || [];

          return (
            <button
              key={`day-${dayNum}`}
              onClick={() => setSelectedDate(dayNum)}
              className={`w-8 h-8 mx-auto rounded-full flex flex-col items-center justify-center relative cursor-pointer font-bold transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm scale-105'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>{dayNum}</span>
              {/* Event indicators */}
              {items.length > 0 && !isSelected && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${
                  items[0].type === 'exam' ? 'bg-indigo-500' : items[0].type === 'assignment' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Event Details Drawer */}
      <div className="mt-5 pt-3 border-t border-slate-50 select-none flex-1">
        {selectedDate && scheduledItems[selectedDate] ? (
          <div className="space-y-2">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Events for Date: {selectedDate}</p>
            {scheduledItems[selectedDate].map((item, idx) => (
              <div key={idx} className="flex gap-2.5 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 items-start">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  item.type === 'exam' ? 'bg-indigo-500' : item.type === 'assignment' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-800 leading-snug">{item.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-3">
            <span className="text-[10px] text-slate-400 font-bold">Select highlighted dates to view scheduled events</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Performance Overview Card (lightweight charts) ─────────────────────────
export function PerformanceOverviewCard({ overview }: {
  overview: {
    averageScore: number;
    passPercentage: number;
    topClass: string;
    weakestClass: string;
    subjectPerformanceTrend: { subject: string; score: number }[];
    classAverageScores: { className: string; average: number }[];
  };
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs p-6 space-y-6">
      <div className="flex items-center justify-between select-none">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" /> Student Performance Overview
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">Real-time grades evaluation tracker</p>
        </div>
      </div>

      {/* Score Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-slate-50 select-none">
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Average Score</span>
          <div className="text-2xl font-black text-indigo-600 tracking-tight">{overview.averageScore}%</div>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pass Percentage</span>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">{overview.passPercentage}%</div>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Top Classroom</span>
          <div className="text-sm font-extrabold text-slate-700 truncate">{overview.topClass}</div>
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Weakest Classroom</span>
          <div className="text-sm font-extrabold text-slate-700 truncate">{overview.weakestClass}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Subject-wise Bar Chart (custom divs instead of recharts) */}
        <div className="space-y-3.5">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest select-none">Subject Performance Trend</h3>
          <div className="h-44 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 pb-1 px-2 relative select-none">
            {overview.subjectPerformanceTrend.map((t) => (
              <div key={t.subject} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                {/* Score Tooltip */}
                <span className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10 select-none leading-none">
                  {t.score}%
                </span>
                {/* Bar */}
                <div
                  className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg transition-all duration-1000 ease-out"
                  style={{ height: `${t.score}%` }}
                />
                {/* Label */}
                <span className="text-[10px] text-slate-400 font-bold mt-2 truncate w-full text-center">
                  {t.subject}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Class-wise averages list */}
        <div className="space-y-3.5 select-none">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Class-wise Average Scores</h3>
          <div className="space-y-4">
            {overview.classAverageScores.map((c) => (
              <div key={c.className} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-bold">{c.className}</span>
                  <span className="text-slate-800 font-black">{c.average}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
                    style={{ width: `${c.average}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Recent Activity Feed ───────────────────────────────────────────────────
export function RecentActivityFeed({ feed }: {
  feed: { id: string; type: string; description: string; timestamp: string; actor: string }[];
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5 select-none">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" /> Recent Activity Feed
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">Real-time log of portal actions</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 relative pl-3.5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 select-none">
        {feed.length === 0 ? (
          <EmptyState title="No Activity" subtitle="All operations synced. Activity timeline will render here." icon={Clock} />
        ) : (
          feed.map((f) => (
            <div key={f.id} className="relative flex flex-col gap-1 items-start leading-snug">
              {/* Timeline marker */}
              <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white bg-indigo-500 shrink-0 shadow-3xs" />
              
              <p className="text-xs font-bold text-slate-700">
                {f.description}
              </p>
              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-semibold mt-0.5">
                <span>By: <span className="text-slate-500 font-bold">{f.actor}</span></span>
                <span>•</span>
                <span>{new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Principal-only Workspace Overview ──────────────────────────────────────
export function WorkspaceOverviewCard({ stats }: {
  stats: { totalTeachers: number; totalStudents: number; totalClasses: number; activeExams: number };
}) {
  return (
    <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/[0.02] to-white border border-indigo-200/50 shadow-3xs p-6 rounded-3xl space-y-4">
      <div className="flex items-center gap-2 select-none">
        <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Workspace Overview</h2>
          <p className="text-slate-400 text-xs mt-0.5">High-level principal workspace analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
        <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-indigo-100 flex items-center justify-between gap-3 shadow-3xs">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Teachers</span>
            <div className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalTeachers}</div>
          </div>
          <span className="text-2xl leading-none select-none">👨‍🏫</span>
        </div>

        <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-indigo-100 flex items-center justify-between gap-3 shadow-3xs">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Students</span>
            <div className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalStudents}</div>
          </div>
          <span className="text-2xl leading-none select-none">🎓</span>
        </div>

        <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-indigo-100 flex items-center justify-between gap-3 shadow-3xs">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Classes</span>
            <div className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalClasses}</div>
          </div>
          <span className="text-2xl leading-none select-none">🏫</span>
        </div>

        <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-indigo-100 flex items-center justify-between gap-3 shadow-3xs">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Exams</span>
            <div className="text-2xl font-black text-slate-800 tracking-tight">{stats.activeExams}</div>
          </div>
          <span className="text-2xl leading-none select-none">📝</span>
        </div>
      </div>
    </div>
  );
}

// ─── Workspace Onboarding / Setup Checklist ──────────────────────────────
export function WorkspaceSetupChecklist({ stats }: {
  stats: { totalTeachers: number; totalStudents: number; totalClasses: number; activeExams: number };
}) {
  const steps = [
    {
      title: 'Add Grade Classes',
      desc: 'Create classroom sections for student assignments.',
      completed: stats.totalClasses > 0,
      href: '/principal/settings',
      actionText: 'Manage Classes',
    },
    {
      title: 'Invite Faculty Teachers',
      desc: 'Register teacher profiles to manage curriculum lectures.',
      completed: stats.totalTeachers > 0,
      href: '/principal/teachers',
      actionText: 'Manage Teachers',
    },
    {
      title: 'Review Admission Requests',
      desc: 'Approve pending student registration requests.',
      completed: stats.totalStudents > 0,
      href: '/principal/join-requests',
      actionText: 'Review Queue',
    },
    {
      title: 'Broadcast Announcement',
      desc: 'Send a campus-wide alert or school bulletin.',
      completed: stats.activeExams > 0 || stats.totalClasses > 1, // dynamically check configuration
      href: '/principal/announcements',
      actionText: 'Create Notice',
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  // Show if the workspace is new (e.g. no classes or teachers)
  const isNewWorkspace = stats.totalClasses === 0 || stats.totalTeachers === 0;
  if (!isNewWorkspace) return null;

  return (
    <div className="bg-gradient-to-br from-teal-950 via-[#0f2b2b] to-emerald-950 border border-teal-800/40 shadow-xl p-6 md:p-8 rounded-3xl text-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Getting Started
          </span>
          <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 mt-1">
            🚀 Setup institutional workspace
          </h2>
          <p className="text-teal-100/60 text-xs font-semibold">
            Complete the checklist below to initialize all institution operations and unlock active dashboards.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-sm font-black block text-emerald-400">{completedCount} of {steps.length} Completed</span>
            <span className="text-[10px] text-teal-200/50">Setup Progress</span>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-teal-900 flex items-center justify-center relative bg-teal-950 font-black text-xs">
            {progressPct}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-teal-950 h-2 rounded-full overflow-hidden border border-teal-900/60">
        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-full ${
              step.completed
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-100'
                : 'bg-white/5 border-white/5 text-teal-100 hover:bg-white/10 hover:border-white/10'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black">{step.title}</span>
                {step.completed ? (
                  <span className="text-xs">✅</span>
                ) : (
                  <span className="text-xs text-teal-400/60">⏳</span>
                )}
              </div>
              <p className="text-[10px] leading-relaxed text-teal-100/50 font-medium mt-1">
                {step.desc}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
              {step.completed ? (
                <span className="text-[9px] font-black uppercase text-emerald-400">Completed</span>
              ) : (
                <a
                  href={step.href}
                  className="inline-flex items-center gap-1 text-[10px] font-extrabold text-teal-300 hover:text-white transition-colors"
                >
                  {step.actionText} <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Principal-only Teacher Activity Summary ───────────────────────────────
export function TeacherActivitySummaryCard({ teachers }: {
  teachers: { id: string; teacherName: string; classesAssigned: number; examsCreated: number }[];
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs p-6 space-y-4">
      <div className="flex items-center justify-between select-none">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Teacher Activity Summary</h2>
          <p className="text-slate-400 text-xs mt-0.5">Faculty workload metrics and activity tracking</p>
        </div>
      </div>

      <div className="overflow-x-auto select-none">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="pb-3 pr-4">Teacher Name</th>
              <th className="pb-3 px-4 text-center">Classes Assigned</th>
              <th className="pb-3 px-4 text-center">Exams Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-slate-400">No teachers found in workspace.</td>
              </tr>
            ) : (
              teachers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 pr-4 font-bold text-slate-800">{t.teacherName}</td>
                  <td className="py-3.5 px-4 text-center">{t.classesAssigned}</td>
                  <td className="py-3.5 px-4 text-center">{t.examsCreated}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Empty State Helper ──────────────────────────────────────────────────────
export function EmptyState({ title, subtitle, icon: Icon }: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50/40 rounded-2xl border border-dashed border-slate-200/60 min-h-[160px] select-none">
      <div className="w-10 h-10 rounded-xl bg-slate-100/80 border border-slate-200/50 text-slate-400 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="text-xs font-black text-slate-800">{title}</h4>
      <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">{subtitle}</p>
    </div>
  );
}

// ─── Skeleton Loaders ────────────────────────────────────────────────────────
export function StatSkeleton() {
  return (
    <div className="bg-white border border-slate-100 shadow-3xs p-6 rounded-3xl animate-pulse space-y-4 select-none">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-slate-100 rounded-sm w-16" />
          <div className="h-8 bg-slate-200 rounded w-24" />
        </div>
        <div className="w-11 h-11 bg-slate-100 rounded-2xl shrink-0" />
      </div>
      <div className="h-3 bg-slate-50 rounded-sm w-full pt-1.5" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-100 shadow-3xs p-6 rounded-3xl animate-pulse space-y-4 select-none min-h-[220px]">
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
      <div className="space-y-3 pt-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between border border-slate-50 p-4 bg-slate-50/20 rounded-2xl">
            <div className="space-y-2 flex-1 pr-4">
              <div className="h-3.5 bg-slate-200 rounded w-2/3" />
              <div className="h-2.5 bg-slate-100 rounded w-1/3" />
            </div>
            <div className="h-6 bg-slate-100 rounded w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PerformanceOverviewSkeleton() {
  return (
    <div className="bg-white border border-slate-100 shadow-3xs p-6 rounded-3xl animate-pulse space-y-6 select-none">
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-3 bg-slate-100 rounded w-1/3" />
      </div>
      <div className="grid grid-cols-4 gap-4 pb-4 border-b border-slate-50">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-2.5 bg-slate-100 rounded w-12" />
            <div className="h-6 bg-slate-200 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
        <div className="space-y-3">
          <div className="h-3 bg-slate-200 rounded w-1/3" />
          <div className="h-36 bg-slate-50 rounded-lg flex items-end gap-3 p-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 bg-slate-100 rounded-t-md h-24" style={{ height: `${20 + i * 15}%` }} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-3 bg-slate-200 rounded w-1/3" />
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 bg-slate-100 rounded w-12" />
                <div className="h-3 bg-slate-200 rounded w-8" />
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
