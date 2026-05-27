import React from 'react';
import { Calendar, CheckCircle2, AlertCircle, TrendingUp, Info, Clock, PlayCircle, BookOpen, Trophy, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// --- Welcome Banner ---
export function WelcomeBanner({ studentName, workspaceName, pendingCount, unreadCount, upcomingCount = 0 }: any) {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'short' });
  const monthName = today.toLocaleDateString('en-US', { month: 'short' });
  const dayNum = today.getDate();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-teal-500/8 via-indigo-500/3 to-white text-slate-800 rounded-3xl p-6 md:p-8 shadow-xs border border-teal-100/60 mb-8 transition-all duration-300">
      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/4 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-500/4 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4 flex-1">
          {/* Avatar Placeholder */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-800 to-emerald-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-teal-800/15 shrink-0 select-none">
            {studentName.charAt(0).toUpperCase()}
          </div>
          
          <div className="min-w-0">
            {/* Tag */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200/50 mb-2.5 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-teal-600" />
              Student Portal
            </span>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-1 flex items-center gap-2 flex-wrap">
              Welcome back, {studentName} <span className="animate-bounce inline-block">👋</span>
            </h1>
            <p className="text-slate-500 text-xs md:text-sm max-w-xl">
              Viewing dashboard at <span className="font-semibold text-teal-700 bg-teal-50/70 px-1.5 py-0.5 rounded border border-teal-200/30">{workspaceName}</span>. Keep up the great work! You are in the top 10% of your class.
            </p>
          </div>
        </div>

        {/* Quick Status Chips & Calendar Container */}
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          {/* Status chips stack */}
          <div className="flex flex-col gap-1.5 sm:flex-row lg:flex-col justify-center">
            <Link 
              href="/studentdashboard/assignments" 
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 hover:bg-amber-100/70 text-amber-900 border border-amber-200/60 rounded-xl text-[11px] font-bold shadow-2xs transition-all duration-200"
            >
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              {pendingCount} Pending Assessment{pendingCount !== 1 ? 's' : ''}
            </Link>
            
            <Link 
              href="/studentdashboard/exams" 
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100/70 text-indigo-900 border border-indigo-200/60 rounded-xl text-[11px] font-bold shadow-2xs transition-all duration-200"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
              {upcomingCount} Upcoming Exam{upcomingCount !== 1 ? 's' : ''}
            </Link>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/60 rounded-xl text-[11px] font-bold shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              96% Attendance Ratio
            </div>
          </div>

          {/* Premium Calendar Widget */}
          <div className="bg-white border border-slate-200/70 p-3 rounded-2xl flex flex-col items-center justify-center text-center shrink-0 w-20 shadow-3xs select-none">
            <span className="text-[9px] uppercase font-extrabold tracking-widest text-teal-600">{dayName}</span>
            <span className="text-2xl font-black text-slate-800 leading-none my-1">{dayNum}</span>
            <span className="text-[9px] font-semibold text-slate-400">{monthName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Pending Work Section ---
export function PendingWorkSection({ pendingItems }: { pendingItems: any[] }) {
  if (!pendingItems || pendingItems.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" /> Action Required
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {pendingItems.map((item, idx) => (
          <Link
            key={idx}
            href={`/studentdashboard/assignments/${item.id}`}
            className="group relative bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-teal-500/40 hover:-translate-y-0.5 transition-all duration-300 flex gap-4 items-start"
          >
            {/* Hover subtle glow backing */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all duration-300">
              <Calendar className="w-5 h-5" />
            </div>

            <div className="flex-1 relative z-10 flex flex-col h-full min-w-0">
              <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-teal-900 transition-colors mb-1.5 truncate">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                {item.message || "This assessment is pending and requires completion."}
              </p>
              <div className="flex items-center justify-between mt-auto gap-4">
                <AssignmentSourceMeta type={item.assignedByType} name={item.assignedByName} date={item.assignedAt} />
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100/75 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 shadow-sm transition-all duration-300 shrink-0">
                  Start <PlayCircle className="w-3.5 h-3.5 fill-current group-hover:fill-none" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// --- Overall Progress Section ---
export function OverallProgressSection({ stats }: any) {
  const averageScore = stats.averageScore || 0;
  
  // Decide score rating and color schemes
  let ratingText = "Needs Practice";
  let ratingColor = "from-rose-500 to-rose-600";
  if (averageScore >= 85) {
    ratingText = "Excellent Performance";
    ratingColor = "from-emerald-500 to-teal-500";
  } else if (averageScore >= 60) {
    ratingText = "Steady Progress";
    ratingColor = "from-indigo-500 to-teal-500";
  } else if (averageScore >= 40) {
    ratingText = "Average Performance";
    ratingColor = "from-amber-500 to-amber-600";
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-5 select-none">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Overall Progress</h2>
          <p className="text-slate-500 text-xs mt-0.5">Real-time performance analytics and metrics</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Exams Taken Card */}
        <div className="group bg-white p-6 rounded-2xl border border-slate-100/80 shadow-3xs transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Exams Completed</span>
              <div className="text-3xl font-black text-slate-800 mt-2 tracking-tight group-hover:text-teal-950 transition-colors">
                {stats.totalExamsTaken}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:scale-110 transition-all duration-300 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          
          {/* SVG mini bars representing progression */}
          <div className="flex items-end justify-between mt-5 pt-1.5 border-t border-slate-50">
            <span className="text-[10px] text-slate-400">All-time completions</span>
            <div className="flex items-end gap-0.5 h-6">
              <span className="w-1.5 h-2 rounded-xs bg-indigo-600/30" />
              <span className="w-1.5 h-3 rounded-xs bg-indigo-600/50" />
              <span className="w-1.5 h-4.5 rounded-xs bg-indigo-600/70" />
              <span className="w-1.5 h-6 rounded-xs bg-indigo-600" />
            </div>
          </div>
        </div>

        {/* Average Score Card */}
        <div className="group bg-white p-6 rounded-2xl border border-slate-100/80 shadow-3xs transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Average Score</span>
              <div className="text-3xl font-black text-slate-800 mt-2 tracking-tight flex items-baseline gap-0.5 group-hover:text-teal-950 transition-colors">
                {averageScore}%
              </div>
            </div>
            {/* SVG Circular semi-gauge inside average score card */}
            <div className="w-12 h-12 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-10 h-10 text-teal-600" viewBox="0 0 36 36">
                <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-teal-600" strokeDasharray={`${averageScore || 2}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
          </div>
          
          {/* Custom Score Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-5 overflow-hidden">
            <div 
              className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", ratingColor)} 
              style={{ width: `${averageScore || 2}%` }}
            ></div>
          </div>
          <div className="text-[9px] font-bold text-slate-500 mt-2 flex justify-between">
            <span>Score Weight</span>
            <span className="font-extrabold text-teal-700">{ratingText}</span>
          </div>
        </div>

        {/* Workspaces Card */}
        <div className="group bg-white p-6 rounded-2xl border border-slate-100/80 shadow-3xs transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Active Portals</span>
              <div className="text-3xl font-black text-slate-800 mt-2 tracking-tight group-hover:text-teal-950 transition-colors">
                {stats.workspaceCount}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:scale-110 transition-all duration-300 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          
          {/* Mini active portals connection link vector */}
          <div className="flex items-center justify-between mt-5 pt-1.5 border-t border-slate-50">
            <span className="text-[10px] text-slate-400">Assigned school system</span>
            <div className="flex items-center gap-1.5 h-6">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="w-8 h-1 bg-slate-100 rounded-full relative overflow-hidden">
                <span className="absolute inset-0 bg-teal-500 rounded-full animate-infinite animate-duration-1000" />
              </span>
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
            </div>
          </div>
        </div>

        {/* Performance Trend Card */}
        <div className="group bg-gradient-to-br from-teal-500/10 via-teal-50/30 to-indigo-500/5 p-6 rounded-2xl border border-teal-100/60 shadow-3xs text-slate-800 transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-teal-700 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                <TrendingUp className="w-3.5 h-3.5" /> Performance Trend
              </span>
              <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                {stats.trendText || "Active"}
              </div>
            </div>
            {/* Sparkline Visual */}
            <div className="opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all shrink-0">
              <svg className="w-16 h-8 text-teal-600 stroke-2 overflow-visible" viewBox="0 0 50 20" fill="none">
                <path d="M0,15 Q12,14 22,6 T42,4 T50,1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="50" cy="1" r="2.5" fill="#0D9488" className="animate-ping" />
                <circle cx="50" cy="1" r="2.5" fill="#0D9488" />
              </svg>
            </div>
          </div>
          <div className="text-[9px] text-slate-500 mt-5 pt-1.5 relative z-10 flex items-center justify-between border-t border-teal-200/20">
            <span>Overall engagement state</span>
            <span className="font-extrabold underline text-teal-700 decoration-teal-500/40">Stable</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- List Sections ---
export function UpcomingExamsSection({ exams }: { exams: any[] }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Upcoming Exams</h2>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs overflow-hidden transition-all duration-300 hover:shadow-sm">
        {exams.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center bg-white rounded-3xl min-h-[220px]">
            {/* Premium minimal SVG Calendar illustration */}
            <div className="w-14 h-14 rounded-2xl bg-teal-50/50 flex items-center justify-center mb-4 border border-teal-100/50 text-teal-600 transition-transform hover:scale-105">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-sm font-extrabold text-slate-800">All Caught Up! 🎉</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">No upcoming exams are scheduled for you at this time.</p>
            <Link 
              href="/studentdashboard/exams" 
              className="mt-4 inline-flex items-center gap-1 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-extrabold rounded-xl transition-all duration-200 hover:shadow-sm cursor-pointer"
            >
              Start Practice <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {exams.map((ex, i) => (
              <Link 
                key={i} 
                href={`/studentdashboard/assignments/${ex.id}`}
                className="p-5 hover:bg-slate-50/60 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-300">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-950 transition-colors truncate">{ex.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/50">
                        {ex.duration} Mins
                      </span>
                      <AssignmentSourceMeta type={ex.assignedType} name={ex.assignedBy} date={ex.assignedAt} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                  Prepare <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function RecentResultsSection({ results }: { results: any[] }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Recent Results</h2>
      </div>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs overflow-hidden transition-all duration-300 hover:shadow-sm">
        {results.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center bg-white rounded-3xl min-h-[220px]">
            {/* Premium minimal SVG trophy/checkmark badge illustration */}
            <div className="w-14 h-14 rounded-2xl bg-teal-50/50 flex items-center justify-center mb-4 border border-teal-100/50 text-teal-600 transition-transform hover:scale-105">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <p className="text-sm font-extrabold text-slate-800">No results yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">Your graded exam papers and score feedback will appear here.</p>
            <Link 
              href="/studentdashboard/exams" 
              className="mt-4 inline-flex items-center gap-1 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-extrabold rounded-xl transition-all duration-200 hover:shadow-sm cursor-pointer"
            >
              Practice Exams <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {results.map((r, i) => {
              const maxScore = r.maxScore || 100;
              const score = r.score || 0;
              const percentage = Math.round((score / maxScore) * 100);
              
              let gradeText = "Pass";
              let gradeColorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
              let progressColorClass = "bg-emerald-500";
              
              if (percentage >= 75) {
                gradeText = "Outstanding";
                gradeColorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                progressColorClass = "bg-emerald-500";
              } else if (percentage >= 40) {
                gradeText = "Passed";
                gradeColorClass = "bg-amber-50 text-amber-700 border-amber-100";
                progressColorClass = "bg-amber-500";
              } else {
                gradeText = "Needs Review";
                gradeColorClass = "bg-rose-50 text-rose-700 border-rose-100";
                progressColorClass = "bg-rose-500";
              }

              return (
                <div key={i} className="p-5 flex items-center justify-between group hover:bg-slate-50/40 transition-colors">
                  <div className="min-w-0 flex-1 pr-4">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{r.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-[10px] text-slate-400 font-semibold">{new Date(r.submittedAt).toLocaleDateString()}</p>
                      <span className={cn("inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase border", gradeColorClass)}>
                        {gradeText}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0 gap-1.5">
                    <span className={cn(
                      "px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1",
                      percentage >= 75 
                        ? "bg-emerald-50/50 text-emerald-700 border-emerald-100" 
                        : percentage >= 40 
                          ? "bg-amber-50/50 text-amber-700 border-amber-100" 
                          : "bg-rose-50/50 text-rose-700 border-rose-100"
                    )}>
                      {score} <span className="opacity-50 font-normal">/ {maxScore}</span>
                    </span>
                    {/* inline visual scale */}
                    <div className="w-24 bg-slate-100 rounded-full h-1 overflow-hidden hidden sm:block">
                      <div className={cn("h-full rounded-full transition-all duration-500", progressColorClass)} style={{ width: `${percentage}%` }}></div>
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

// --- Utility Components ---
export function AssignmentSourceMeta({ type, name, date }: any) {
  const isTutor = type === 'tutor' || type === 'system';
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 select-none">
      <span className={cn(
        "w-1.5 h-1.5 rounded-full inline-block shrink-0",
        isTutor ? "bg-teal-400 animate-pulse" : "bg-purple-400"
      )}></span>
      <span className="truncate">
        Assigned by <span className="font-semibold text-slate-600">{name}</span>
        {date && ` • ${new Date(date).toLocaleDateString()}`}
      </span>
    </div>
  );
}
