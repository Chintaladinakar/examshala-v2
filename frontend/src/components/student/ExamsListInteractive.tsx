"use client";

import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Calendar, CheckCircle2, Trophy, Clock, ArrowUpDown, Filter, AlertCircle, Sparkles, PlayCircle, Eye, RefreshCw, BarChart2, Award } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Define the Exam type
interface Exam {
  id: string;
  title: string;
  category: string;
  type: 'practice' | 'mock' | 'live';
  duration: number; // Mins
  questions: number;
  marks: number;
  date: string;
  status: 'not_started' | 'completed' | 'ongoing';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  score?: number; // For completed
  countdownText?: string; // For nearest upcoming
  dateSeconds: number; // For sorting
}

const INITIAL_EXAMS: Exam[] = [
  {
    id: 'math-final',
    title: 'Mathematics Term-End Assessment',
    category: 'Mathematics',
    type: 'live',
    duration: 90,
    questions: 45,
    marks: 100,
    date: 'May 29, 2026 - 10:00 AM',
    status: 'not_started',
    difficulty: 'Hard',
    countdownText: 'Starting in 2 Days',
    dateSeconds: 172800,
  },
  {
    id: 'cs-mock',
    title: 'Computer Science Programming Lab Mock',
    category: 'Computer Science',
    type: 'mock',
    duration: 60,
    questions: 25,
    marks: 50,
    date: 'May 31, 2026 - 02:00 PM',
    status: 'not_started',
    difficulty: 'Medium',
    countdownText: 'Starting in 4 Days',
    dateSeconds: 345600,
  },
  {
    id: 'chem-practice',
    title: 'Organic Chemistry Practice Test',
    category: 'Chemistry',
    type: 'practice',
    duration: 45,
    questions: 20,
    marks: 40,
    date: 'Available Now',
    status: 'not_started',
    difficulty: 'Easy',
    dateSeconds: 0,
  },
  {
    id: 'english-quiz',
    title: 'English Grammar Basics Quiz',
    category: 'English',
    type: 'practice',
    duration: 30,
    questions: 30,
    marks: 30,
    date: 'Completed May 25',
    status: 'completed',
    difficulty: 'Easy',
    score: 88,
    dateSeconds: 999999,
  },
  {
    id: 'phys-mock',
    title: 'Physics Mechanics Mock Assessment',
    category: 'Physics',
    type: 'mock',
    duration: 120,
    questions: 60,
    marks: 120,
    date: 'June 03, 2026 - 09:00 AM',
    status: 'not_started',
    difficulty: 'Hard',
    countdownText: 'Starting in 7 days',
    dateSeconds: 604800,
  },
];

interface ExamsListInteractiveProps {
  initialUpcomingExams?: any[];
  initialRecentResults?: any[];
}

export function ExamsListInteractive({
  initialUpcomingExams = [],
  initialRecentResults = []
}: ExamsListInteractiveProps) {
  const [exams, setExams] = useState<Exam[]>(() => {
    const dbExams: Exam[] = [];

    // Map upcoming exams from DB
    initialUpcomingExams.forEach((ex) => {
      dbExams.push({
        id: ex.id,
        title: ex.title,
        category: ex.category || 'General',
        type: ex.assignedType === 'practice' ? 'practice' : 'live',
        duration: ex.duration || 45,
        questions: ex.questions || 10,
        marks: ex.marks || 100,
        date: ex.startWindow 
          ? new Date(ex.startWindow).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : (ex.assignedAt ? new Date(ex.assignedAt).toLocaleDateString() : 'Available Now'),
        status: 'not_started',
        difficulty: 'Medium',
        dateSeconds: ex.startWindow ? new Date(ex.startWindow).getTime() / 1000 : 0,
      });
    });

    // Map recent results (completed exams) from DB
    initialRecentResults.forEach((r) => {
      const percentage = r.maxScore ? Math.round((r.score / r.maxScore) * 100) : r.score;
      dbExams.push({
        id: r.id,
        title: r.title,
        category: 'General',
        type: 'live',
        duration: 45,
        questions: 10,
        marks: r.maxScore || 100,
        date: r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : 'Completed',
        status: 'completed',
        difficulty: 'Medium',
        score: percentage,
        dateSeconds: r.submittedAt ? new Date(r.submittedAt).getTime() / 1000 : 999999,
      });
    });

    // Merge database exams with mock initial exams, prioritizing DB exams
    return [...dbExams, ...INITIAL_EXAMS.filter(ie => !dbExams.some(de => de.id === ie.id))];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'completed' | 'practice' | 'live' | 'mock'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'duration'>('newest');

  // Filter and Sort assessments
  const filteredAndSortedExams = useMemo(() => {
    return exams
      .filter((exam) => {
        // 1. Search Query Match
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          exam.title.toLowerCase().includes(query) ||
          exam.category.toLowerCase().includes(query);

        if (!matchesSearch) return false;

        // 2. Status Category Tab filter
        if (filterTab === 'upcoming') return exam.status === 'not_started' && exam.type !== 'practice';
        if (filterTab === 'completed') return exam.status === 'completed';
        if (filterTab === 'practice') return exam.type === 'practice';
        if (filterTab === 'live') return exam.type === 'live';
        if (filterTab === 'mock') return exam.type === 'mock';

        return true;
      })
      .sort((a, b) => {
        // 3. Sorting
        if (sortBy === 'newest') {
          return a.dateSeconds - b.dateSeconds; // Smaller/nearer first
        }
        if (sortBy === 'duration') {
          return b.duration - a.duration; // Longest first
        }
        return 0;
      });
  }, [exams, searchQuery, filterTab, sortBy]);

  // Find nearest upcoming live/mock exam for featured banner
  const nearestExam = useMemo(() => {
    return exams
      .filter(e => e.status === 'not_started' && e.type !== 'practice')
      .sort((a, b) => a.dateSeconds - b.dateSeconds)[0] || null;
  }, [exams]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterTab('all');
    setSortBy('newest');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        {/* Completed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100/90 shadow-3xs flex items-center justify-between transition-all hover:shadow-2xs">
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Exams Taken</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight mt-0.5 block">1</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100/90 shadow-3xs flex items-center justify-between transition-all hover:shadow-2xs">
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Upcoming Exams</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight mt-0.5 block">3</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Avg Score */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100/90 shadow-3xs flex items-center justify-between transition-all hover:shadow-2xs">
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Average Score</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight mt-0.5 block">88%</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/50 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        {/* Practice Attempts */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100/90 shadow-3xs flex items-center justify-between transition-all hover:shadow-2xs">
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Practice Attempts</span>
            <span className="text-2xl font-black text-slate-800 tracking-tight mt-0.5 block">4</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/50 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Featured Nearest Upcoming Exam Preview Card */}
      {nearestExam && (
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500/10 via-indigo-500/3 to-white p-6 rounded-3xl border border-rose-200/40 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="relative z-10 flex-1 space-y-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200/50 text-[9px] font-black uppercase tracking-wider select-none animate-pulse">
                Next Assessment Alert
              </span>
              <span className="inline-flex px-2 py-0.5 bg-slate-900 text-white rounded text-[9px] font-bold tracking-wide select-none">
                {nearestExam.countdownText}
              </span>
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-extrabold text-slate-950 tracking-tight">
                {nearestExam.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Subject: <span className="font-bold text-slate-700">{nearestExam.category}</span> • Scheduled on <span className="font-bold text-indigo-700">{nearestExam.date}</span>
              </p>
            </div>
          </div>

          <div className="relative z-10 shrink-0 w-full md:w-auto flex items-center gap-3">
            <Link 
              href="/studentdashboard/schedule" 
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-3xs transition-all select-none"
            >
              View Schedule
            </Link>
            <Link 
              href={`/studentdashboard/exams/${nearestExam.id}`}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:shadow-2xs select-none"
            >
              Start Practice <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 3. Filter + Search Section */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between pb-4 border-b border-slate-200/50">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </span>
          <input 
            type="text"
            placeholder="Search exams by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2 pl-10 pr-4 text-xs md:text-sm focus:bg-white focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-slate-700 shadow-3xs"
            aria-label="Search exams"
          />
        </div>

        {/* Tab Filters and Sorting Stack */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tab list */}
          <div className="bg-slate-100 p-1 rounded-2xl flex flex-wrap gap-0.5 shadow-3xs select-none">
            {([
              { id: 'all', label: 'All' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'completed', label: 'Completed' },
              { id: 'practice', label: 'Practice' },
              { id: 'live', label: 'Live' },
              { id: 'mock', label: 'Mock' }
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all select-none cursor-pointer",
                  filterTab === tab.id 
                    ? "bg-white text-teal-950 shadow-2xs" 
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-2xl shadow-3xs select-none">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'duration')}
              className="text-xs font-bold text-slate-600 bg-transparent border-none outline-hidden focus:ring-0 cursor-pointer"
              aria-label="Sort exams by"
            >
              <option value="newest">Sort: Nearest</option>
              <option value="duration">Sort: Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Exams Cards Grid */}
      {filteredAndSortedExams.length === 0 ? (
        /* Dynamic Empty State Redesign */
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          {/* Custom SVG Calendar/Exam mockup vector */}
          <div className="w-16 h-16 rounded-2xl bg-teal-50/50 flex items-center justify-center mb-5 border border-teal-100/50 text-teal-600 select-none">
            <Calendar className="w-8 h-8" />
          </div>
          
          <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">No Exams Available Yet</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
            {searchQuery 
              ? `We couldn't find any exams matching "${searchQuery}". Try editing your query.`
              : "Practice, mock, and live exams assigned by your organization will appear here once active."
            }
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button 
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-200 select-none cursor-pointer"
            >
              Reset Filters
            </button>
            <Link 
              href="/studentdashboard/schedule" 
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60 text-xs font-bold rounded-xl transition-all duration-200 select-none cursor-pointer"
            >
              View Schedule
            </Link>
          </div>
        </div>
      ) : (
        /* Exams Grid cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedExams.map((exam) => {
            const isCompleted = exam.status === 'completed';
            
            // Badge color configurations
            let typeBadgeClass = "bg-amber-50 text-amber-700 border-amber-200/50";
            if (exam.type === 'live') typeBadgeClass = "bg-rose-50 text-rose-700 border-rose-200/50";
            if (exam.type === 'mock') typeBadgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200/50";

            return (
              <div 
                key={exam.id}
                className="group relative bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[300px]"
              >
                {/* Visual hover backing light glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="relative z-10">
                  {/* Category Badge & Subject Details */}
                  <div className="flex items-center justify-between mb-4 select-none">
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200/60 text-[9px] font-extrabold uppercase tracking-wider">
                      {exam.category}
                    </span>
                    
                    <span className={cn(
                      "inline-flex px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider",
                      typeBadgeClass
                    )}>
                      {exam.type}
                    </span>
                  </div>

                  {/* Title & Teacher */}
                  <h3 className="font-extrabold text-slate-800 text-base leading-snug tracking-tight mb-3 group-hover:text-teal-950 transition-colors">
                    {exam.title}
                  </h3>

                  {/* Meta Grid Specs */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-6 border-b border-slate-50 pb-4 text-xs font-semibold text-slate-400 select-none">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                      <span>{exam.duration} Mins</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-slate-300" />
                      <span>{exam.questions} Questions</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-slate-300" />
                      <span>{exam.marks} Marks</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-300" />
                      <span>Level: {exam.difficulty}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="relative z-10 flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                  <div className="flex flex-col gap-0.5 select-none">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Schedule</span>
                    <span className="text-[10px] font-bold text-slate-600 truncate max-w-[130px]">{exam.date}</span>
                  </div>
                  
                  {isCompleted ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-xl border border-emerald-100/50">
                        {exam.score}%
                      </span>
                      <Link 
                        href={`/studentdashboard/results/${exam.id}`}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all duration-200 select-none shadow-3xs cursor-pointer"
                      >
                        Review
                      </Link>
                    </div>
                  ) : (
                    <Link 
                      href={`/studentdashboard/exams/${exam.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-3xs hover:shadow-xs select-none cursor-pointer"
                    >
                      Start <PlayCircle className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Recent Activity Log */}
      <div className="pt-6 border-t border-slate-200/50 select-none">
        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Recent Exams Activity</h4>
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/40 space-y-3.5">
          <div className="flex items-start justify-between text-xs gap-4 border-b border-slate-200/20 pb-3">
            <p className="text-slate-600 font-bold">
              Attempted and completed <span className="text-teal-700">English Grammar Basics Quiz</span>
            </p>
            <span className="text-[10px] text-slate-400 font-semibold shrink-0">May 25, 2026</span>
          </div>
          
          <div className="flex items-start justify-between text-xs gap-4 border-b border-slate-200/20 pb-3">
            <p className="text-slate-600 font-bold">
              Viewed upcoming syllabus details for <span className="text-indigo-700">Mathematics Term-End Assessment</span>
            </p>
            <span className="text-[10px] text-slate-400 font-semibold shrink-0">May 24, 2026</span>
          </div>

          <div className="flex items-start justify-between text-xs gap-4">
            <p className="text-slate-600 font-bold">
              Completed practice mockup paper: <span className="text-amber-700">Organic Chemistry practice test</span>
            </p>
            <span className="text-[10px] text-slate-400 font-semibold shrink-0">May 21, 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
