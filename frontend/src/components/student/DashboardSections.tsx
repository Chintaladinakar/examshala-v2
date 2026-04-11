import React from 'react';
import { Calendar, CheckCircle2, AlertCircle, TrendingUp, Info, Clock, PlayCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// --- Welcome Banner ---
export function WelcomeBanner({ studentName, workspaceName, pendingCount, unreadCount }: any) {
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Welcome back, {studentName}
        </h1>
        <p className="text-slate-600">
          Currently viewing <span className="font-medium text-slate-800">{workspaceName}</span>.
        </p>
      </div>
      <div className="flex gap-4">
        {pendingCount > 0 && (
          <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium border border-amber-100/50 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {pendingCount} Pending Assessment{pendingCount > 1 ? 's' : ''}
          </div>
        )}
        {unreadCount > 0 && (
          <div className="bg-teal-50 text-teal-700 px-4 py-2 rounded-xl text-sm font-medium border border-teal-100 flex items-center gap-2">
            <Info className="w-4 h-4" />
            {unreadCount} Unread Reminder{unreadCount > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Pending Work Section ---
export function PendingWorkSection({ pendingItems }: { pendingItems: any[] }) {
  if (!pendingItems || pendingItems.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-amber-500" />
        Action Required
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingItems.map((item, idx) => (
          <Link
            key={idx}
            href={`/studentdashboard/assignments/${item.id}`}
            className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition-all flex gap-4 items-start"
          >
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors mb-1">
                {item.title}
              </h3>
              <p className="text-sm text-slate-500 mb-3 line-clamp-1">{item.message}</p>
              <div className="flex items-center justify-between mt-auto">
                <AssignmentSourceMeta type={item.assignedByType} name={item.assignedByName} date={item.assignedAt} />
                <span className="text-xs font-semibold text-teal-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                  View <PlayCircle className="w-3 h-3" />
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
  return (
    <div className="mb-10">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Overall Progress</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-slate-500 text-sm font-medium mb-1">Exams Taken</div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalExamsTaken}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-slate-500 text-sm font-medium mb-1">Avg Score</div>
          <div className="text-3xl font-bold text-slate-900">{stats.averageScore}%</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-slate-500 text-sm font-medium mb-1">Workspaces</div>
          <div className="text-3xl font-bold text-slate-900">{stats.workspaceCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm bg-gradient-to-br from-teal-50 to-white">
          <div className="text-teal-700 text-sm font-medium mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> Trend
          </div>
          <div className="text-xl font-bold text-teal-900 mt-2">{stats.trendText}</div>
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
        <h2 className="text-lg font-semibold text-slate-900">Upcoming Exams</h2>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {exams.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No upcoming exams.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {exams.map((ex, i) => (
              <Link 
                key={i} 
                href={`/studentdashboard/assignments/${ex.id}`}
                className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{ex.title}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                      <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {ex.duration} Mins
                      </span>
                      <AssignmentSourceMeta type={ex.assignedType} name={ex.assignedBy} date={ex.assignedAt} />
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex text-sm text-teal-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Prepare &rarr;
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
        <h2 className="text-lg font-semibold text-slate-900">Recent Results</h2>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {results.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No results yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {results.map((r, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{r.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{new Date(r.submittedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={cn(
                    "font-bold text-lg",
                    (r.score / r.maxScore) > 0.4 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {r.score} <span className="text-sm font-medium opacity-60">/ {r.maxScore}</span>
                  </span>
                </div>
              </div>
            ))}
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
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className={cn(
        "w-1.5 h-1.5 rounded-full inline-block",
        isTutor ? "bg-teal-500" : "bg-purple-500"
      )}></span>
      <span>
        Assigned by <span className="font-medium text-slate-700">{name}</span>
        {date && ` • ${new Date(date).toLocaleDateString()}`}
      </span>
    </div>
  );
}
