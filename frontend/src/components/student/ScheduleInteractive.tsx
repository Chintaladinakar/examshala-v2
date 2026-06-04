"use client";

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  Clock, 
  BookOpen, 
  Video, 
  CheckCircle2, 
  AlertCircle, 
  PlayCircle, 
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles,
  ClipboardList,
  FolderOpen
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Interfaces for scheduler data structure
interface ScheduleEvent {
  id: string;
  title: string;
  type: 'Exam' | 'Assignment' | 'Live Class';
  dateTime: string | Date;
  endDateTime: string | Date;
  duration: number;
  status: 'Upcoming' | 'Live' | 'Completed' | 'Missed';
  metadata: {
    assignedBy?: string;
    assignedType?: string;
    subject?: string;
    teacherName?: string;
    marks?: number;
    joinUrl?: string;
  };
}

interface ScheduleInteractiveProps {
  initialData: {
    events: ScheduleEvent[];
    stats: {
      upcomingExamsCount: number;
      pendingAssignmentsCount: number;
      nextLiveSession: {
        title: string;
        dateTime: string;
        joinUrl: string;
      } | null;
    };
  };
}

export function ScheduleInteractive({ initialData }: ScheduleInteractiveProps) {
  const [events] = useState<ScheduleEvent[]>(initialData.events);
  const [stats] = useState(initialData.stats);
  
  // State for filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'exam' | 'assignment' | 'live_class'>('all');

  // Filter events (Always shows all days sorted by datetime)
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // 1. Search filter
      const matchesSearch = 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (e.metadata.subject && e.metadata.subject.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Tab filter
      if (activeTab === 'exam' && e.type !== 'Exam') return false;
      if (activeTab === 'assignment' && e.type !== 'Assignment') return false;
      if (activeTab === 'live_class' && e.type !== 'Live Class') return false;

      return true;
    });
  }, [events, searchQuery, activeTab]);

  // Format single event time display
  const formatEventTime = (dateTimeStr: string | Date, endDateTimeStr?: string | Date) => {
    const start = new Date(dateTimeStr);
    const startStr = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    if (endDateTimeStr) {
      const end = new Date(endDateTimeStr);
      const endStr = end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${startStr} - ${endStr}`;
    }
    return startStr;
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Breadcrumbs and Header */}
      <div className="space-y-1 select-none">
        <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">
          <Link href="/studentdashboard" className="hover:text-teal-600 transition-colors">Dashboard</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-500 font-extrabold">Schedule</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Academic Schedule</h1>
        <p className="text-xs md:text-sm text-slate-500">
          Plan your week, view live sessions, track assignment due dates, and monitor assessment timelines.
        </p>
      </div>



      {/* 4. Controls & Filters Row */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between pb-4 border-b border-slate-200/50">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </span>
          <input 
            type="text"
            placeholder="Search events by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2 pl-10 pr-4 text-xs md:text-sm focus:bg-white focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-slate-700 shadow-3xs"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-2xl flex flex-wrap gap-0.5 shadow-3xs select-none">
            {([
              { id: 'all', label: 'All' },
              { id: 'exam', label: 'Exams' },
              { id: 'live_class', label: 'Live Classes' }
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  activeTab === tab.id 
                    ? "bg-white text-teal-950 shadow-2xs" 
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 5. Agenda List & Vertical Timeline */}
      <div className="space-y-4">
        {/* Selected date label header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 select-none">
          <h2 className="text-xs md:text-sm font-extrabold text-slate-400 uppercase tracking-widest">
            Academic Agenda
          </h2>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
            {filteredEvents.length} events
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          /* Custom Redesigned Empty State */
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
            <div className="w-14 h-14 rounded-2xl bg-teal-50/50 flex items-center justify-center mb-5 border border-teal-100/50 text-teal-600 select-none">
              <Calendar className="w-7 h-7" />
            </div>
            
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">No academic events scheduled</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed font-semibold">
              {searchQuery 
                ? `We couldn't find any events matching "${searchQuery}".` 
                : "You have completed all scheduled academic exams, classes, and tasks."
              }
            </p>

            {(searchQuery || activeTab !== 'all') && (
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button 
                  onClick={handleResetFilters}
                  className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-200 select-none cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Desktop Vertical Timeline / Mobile Stacked Cards Layout */
          <div className="relative pl-6 md:pl-10 space-y-6 before:absolute before:inset-y-0 before:left-3 md:before:left-5 before:w-0.5 before:bg-slate-100">
            {filteredEvents.map((event) => {
              const isExam = event.type === 'Exam';
              const isAssignment = event.type === 'Assignment';
              const isLiveClass = event.type === 'Live Class';

              // Determine dot visual styles based on status
              let dotClass = "bg-slate-200 border-slate-100 text-slate-400";
              let ringPulse = false;
              let dotIcon = null;

              if (event.status === 'Live') {
                dotClass = "bg-rose-500 border-rose-100 text-white";
                ringPulse = true;
              } else if (event.status === 'Completed') {
                dotClass = "bg-emerald-500 border-emerald-100 text-white";
                dotIcon = <CheckCircle2 className="w-2.5 h-2.5 stroke-[3px]" />;
              } else if (event.status === 'Missed') {
                dotClass = "bg-rose-100 border-rose-200 text-rose-600";
                dotIcon = <AlertCircle className="w-2.5 h-2.5 stroke-[3px]" />;
              } else {
                // Upcoming
                if (isExam) dotClass = "bg-rose-600 border-rose-100 text-white";
                else if (isAssignment) dotClass = "bg-indigo-600 border-indigo-100 text-white";
                else dotClass = "bg-teal-600 border-teal-100 text-white";
              }

              // Determine event type badge styles
              let typeBadgeClass = "bg-slate-50 text-slate-500 border-slate-200/60";
              if (isExam) typeBadgeClass = "bg-rose-50 text-rose-700 border-rose-100";
              if (isAssignment) typeBadgeClass = "bg-indigo-50 text-indigo-700 border-indigo-100";
              if (isLiveClass) typeBadgeClass = "bg-teal-50 text-teal-700 border-teal-100";

              // Determine card border visual indicator
              let cardBorderClass = "border-l-4 border-l-slate-200";
              if (isExam) cardBorderClass = "border-l-4 border-l-rose-500";
              if (isAssignment) cardBorderClass = "border-l-4 border-l-indigo-500";
              if (isLiveClass) cardBorderClass = "border-l-4 border-l-teal-500";

              return (
                <div key={event.id} className="relative group select-none">
                  {/* Timeline indicator node */}
                  <div className={cn(
                    "absolute left-[-23px] md:left-[-30px] top-4 w-4 h-4 rounded-full border-4 border-white flex items-center justify-center transition-transform duration-200 z-10 shrink-0",
                    dotClass
                  )}>
                    {dotIcon}
                    {ringPulse && (
                      <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping -z-10 opacity-75"></span>
                    )}
                  </div>

                  {/* Scheduler Agenda Card */}
                  <div className={cn(
                    "bg-white p-5 rounded-3xl border border-slate-100 shadow-3xs hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5",
                    cardBorderClass
                  )}>
                    
                    {/* Event main details block */}
                    <div className="space-y-3.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Type Badge */}
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-md border text-[9px] font-extrabold uppercase tracking-wider",
                          typeBadgeClass
                        )}>
                          {event.type}
                        </span>

                        {/* Date badge */}
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/50 text-[9px] font-bold text-slate-500">
                          {new Date(event.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>

                        {/* Status badge */}
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider",
                          event.status === 'Live' ? "bg-rose-600 text-white animate-pulse" :
                          event.status === 'Completed' ? "bg-emerald-50 text-emerald-700" :
                          event.status === 'Missed' ? "bg-rose-50 text-rose-700" :
                          "bg-slate-100 text-slate-500"
                        )}>
                          {event.status}
                        </span>
                      </div>

                      <div>
                        {/* Event Title */}
                        <h3 className="font-extrabold text-slate-800 text-base leading-snug tracking-tight hover:text-teal-950 transition-colors">
                          {event.title}
                        </h3>

                        {/* Event details footer row */}
                        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs font-semibold text-slate-400 mt-2">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Clock className="w-3.5 h-3.5 text-slate-300" />
                            <span>{formatEventTime(event.dateTime, event.endDateTime)}</span>
                          </div>
                          
                          {/* Subject Detail */}
                          {event.metadata.subject && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <BookOpen className="w-3.5 h-3.5 text-slate-300" />
                              <span>{event.metadata.subject}</span>
                            </div>
                          )}

                          {/* Extra info based on type */}
                          {isLiveClass && event.metadata.teacherName && (
                            <span className="text-[11px] font-normal text-slate-400">
                              Instructor: <span className="text-slate-600 font-bold">{event.metadata.teacherName}</span>
                            </span>
                          )}

                          {isExam && event.metadata.assignedBy && (
                            <span className="text-[11px] font-normal text-slate-400">
                              Assigned by: <span className="text-slate-600 font-bold">{event.metadata.assignedBy}</span>
                            </span>
                          )}

                          {isAssignment && event.metadata.marks && (
                            <span className="text-[11px] font-normal text-slate-400">
                              Marks: <span className="text-slate-600 font-bold">{event.metadata.marks} PTS</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons (Direct link integrations) */}
                    <div className="shrink-0 flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                      {isLiveClass && (
                        <>
                          {event.status === 'Completed' ? (
                            <span className="text-xs font-bold text-slate-400 px-3 py-2 bg-slate-50 border border-slate-200/40 rounded-xl">
                              Session Ended
                            </span>
                          ) : (
                            <a 
                              href={event.metadata.joinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "inline-flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold rounded-xl shadow-3xs hover:shadow-xs transition-all cursor-pointer",
                                event.status === 'Live' 
                                  ? "bg-teal-600 hover:bg-teal-700 text-white" 
                                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                              )}
                            >
                              Join Session <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </>
                      )}

                      {isExam && (
                        <>
                          {event.status === 'Completed' ? (
                            <Link 
                              href="/studentdashboard/results"
                              className="inline-flex items-center gap-1 px-4.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-3xs cursor-pointer"
                            >
                              Review Result
                            </Link>
                          ) : event.status === 'Missed' ? (
                            <span className="text-xs font-bold text-rose-700 px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl">
                              Missed Exam Window
                            </span>
                          ) : (
                            <Link 
                              href="/studentdashboard/exams"
                              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-3xs hover:shadow-xs transition-all cursor-pointer"
                            >
                              Take Exam <PlayCircle className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </>
                      )}


                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
