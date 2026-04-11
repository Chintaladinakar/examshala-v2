import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { AssignmentSourceMeta } from '@/components/student/DashboardSections';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ExamDetailsPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    redirect('/signin');
  }

  let assignment = null;
  let authFailed = false;

  try {
    const response = await fetch(`http://localhost:5000/api/student/assignments/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) authFailed = true;
      else if (response.status === 404) return <ErrorState message="Assignment not found." />;
      else throw new Error('Failed to load instructions');
    } else {
      const payload = await response.json();
      assignment = payload.data;
    }
  } catch (error) {
    return <ErrorState message="Failed to connect to the backend server." />;
  }

  if (authFailed) {
    redirect('/signin');
  }

  if (!assignment) return <ErrorState message="Assignment data is missing." />;

  return (
    <div className="max-w-4xl mx-auto">
      <Link 
        href="/studentdashboard" 
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Header Block */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
                  Assessment
                </span>
                <AssignmentSourceMeta 
                  type={assignment.assignedByType} 
                  name={assignment.assignedBy} 
                  date={assignment.assignedAt} 
                />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{assignment.testTitle}</h1>
              
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">{assignment.duration} Minutes</span>
                </div>
                {assignment.scheduleWindowStart && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Scheduled: {new Date(assignment.scheduleWindowStart).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-end">
              {assignment.isEligibleToStart ? (
                <div className="bg-emerald-50 text-emerald-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4" /> Available Now
                </div>
              ) : (
                <div className="bg-amber-50 text-amber-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-amber-100">
                  <AlertCircle className="w-4 h-4" /> Not Available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions Block */}
        <div className="p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Instructions</h2>
          <div className="prose prose-slate max-w-none text-slate-600 bg-slate-50 p-6 rounded-xl border border-slate-100">
            {(assignment.instructions || "No instructions provided.").split('\n').map((para: string, idx: number) => (
              <p key={idx} className="mb-4 last:mb-0 leading-relaxed font-medium">
                {para}
              </p>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-end border-t border-slate-100 pt-6">
            <button
              disabled={!assignment.isEligibleToStart}
              className="px-8 py-3 bg-teal-700 text-white font-semibold rounded-xl hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              Start Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
      <h2 className="text-xl font-bold text-slate-700 mb-2">Error</h2>
      <p className="text-slate-500">{message}</p>
      <Link href="/studentdashboard" className="mt-6 px-6 py-2 bg-slate-100 font-medium rounded-lg hover:bg-slate-200 transition-colors text-slate-700">
        Return Home
      </Link>
    </div>
  );
}
