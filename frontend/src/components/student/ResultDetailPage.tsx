"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  ChevronRight, 
  Sparkles,
  Zap,
  Percent,
  BarChart3
} from 'lucide-react';

interface ResultDetailProps {
  result: {
    id: string;
    examId: string;
    title: string;
    subject: string;
    score: number;
    totalMarks: number;
    percentage: number;
    grade: string;
    rank: number | null;
    status: string;
    feedback: string | null;
    timeTaken: number | null;
    createdAt: string;
    accuracy: number;
    speed: number;
    conceptMastery: number;
    correct: number;
    incorrect: number;
    skipped: number;
    classAverage: number;
    topperScore: number;
    percentile: number;
    insights: string[];
  };
}

export default function ResultDetailPage({ result }: ResultDetailProps) {
  if (!result) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-slate-500 font-medium">Result record could not be loaded.</p>
        <Link href="/studentdashboard/results" className="text-indigo-600 font-bold hover:underline">
          Back to Results
        </Link>
      </div>
    );
  }

  const isExcellent = result.status === 'Excellent' || result.percentage >= 90;
  const isPassed = result.status === 'Passed' || result.percentage >= 60;

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-3 text-slate-500 font-semibold text-sm">
        <Link 
          href="/studentdashboard/results"
          className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors bg-white px-3.5 py-2 border border-slate-200 rounded-xl shadow-sm hover:border-indigo-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Academic Results</span>
        </Link>
      </div>

      {/* 1. TOP SUMMARY CARD */}
      <div className="relative bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-black tracking-widest text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                {result.subject}
              </span>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-800 mt-2">
                {result.title}
              </h1>
              <p className="text-slate-400 font-medium text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                Assessment completed on {new Date(result.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
              </p>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Time taken: <strong>{result.timeTaken || 60} mins</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span>Percentile: <strong>{result.percentile}%</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Rank: <strong>#{result.rank || 'N/A'}</strong> in class</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 self-start lg:self-center shrink-0">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center min-w-[120px] shadow-sm">
              <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Score Secured</span>
              <span className="text-3xl font-black text-slate-800">{result.score}</span>
              <span className="text-slate-400 text-sm font-semibold"> / {result.totalMarks}</span>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-5 text-center min-w-[120px] shadow-sm">
              <span className="block text-[10px] text-indigo-500 uppercase font-black tracking-wider mb-1">Percentage</span>
              <span className="text-3xl font-extrabold text-indigo-600">{Math.round(result.percentage)}%</span>
              <span className="block text-[10px] text-indigo-400 font-bold mt-0.5">Grade: {result.grade}</span>
            </div>
          </div>
        </div>

        {result.feedback && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-start gap-3 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
            <Sparkles className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-700">Tutor Feedback</h4>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">"{result.feedback}"</p>
            </div>
          </div>
        )}
      </div>

      {/* 2-Column Details Dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: PERFORMANCE BREAKDOWN & QUESTION ANALYTICS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Performance Breakdown */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Performance Breakdown</h3>
              <p className="text-xs text-slate-400 font-medium">Fine-grained indicators based on pacing and accuracy variables</p>
            </div>

            <div className="space-y-5">
              {/* Accuracy */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-500" />
                    Accuracy Rate
                  </span>
                  <span className="font-extrabold text-slate-800">{result.accuracy}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${result.accuracy}%` }} />
                </div>
              </div>

              {/* Speed */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Pacing & Speed
                  </span>
                  <span className="font-extrabold text-slate-800">{result.speed}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${result.speed}%` }} />
                </div>
              </div>

              {/* Concept Mastery */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-500" />
                    Concept Mastery
                  </span>
                  <span className="font-extrabold text-slate-800">{result.conceptMastery}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="h-2 rounded-full bg-purple-500 transition-all duration-500" style={{ width: `${result.conceptMastery}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Question Analytics */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Question Analytics</h3>
              <p className="text-xs text-slate-400 font-medium">Session assessment completion breakdown</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-center">
                <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <span className="block text-xs font-bold text-slate-500">Correct Answers</span>
                <span className="text-xl font-extrabold text-emerald-700 mt-1 block">{result.correct} Questions</span>
              </div>

              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 text-center">
                <XCircle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
                <span className="block text-xs font-bold text-slate-500">Incorrect Answers</span>
                <span className="text-xl font-extrabold text-rose-700 mt-1 block">{result.incorrect} Questions</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-center">
                <HelpCircle className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <span className="block text-xs font-bold text-slate-500">Skipped & Unresolved</span>
                <span className="text-xl font-extrabold text-slate-700 mt-1 block">{result.skipped} Questions</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: AI INSIGHTS & CLASS COMPARISON */}
        <div className="space-y-8">
          
          {/* AI Insights Section */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-950/80 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles className="w-40 h-40" />
            </div>
            
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h3 className="text-base font-black tracking-wide uppercase">AI Insights</h3>
            </div>

            <div className="space-y-3.5 flex-1">
              {result.insights.map((insight, idx) => (
                <div key={idx} className="flex gap-2 text-sm font-medium text-indigo-100 bg-indigo-950/40 p-3 rounded-xl border border-indigo-800/40">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0 mt-2" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Peer Comparison Section */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Peer Comparison</h3>
              <p className="text-xs text-slate-400 font-medium">Comparison of your score with key benchmark metrics</p>
            </div>

            <div className="space-y-4">
              
              {/* Class Average */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Class Average</span>
                  <span>{result.classAverage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400 rounded-full" style={{ width: `${result.classAverage}%` }} />
                </div>
              </div>

              {/* Your Score */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-indigo-600">
                  <span>Your Score</span>
                  <span>{Math.round(result.percentage)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${result.percentage}%` }} />
                </div>
              </div>

              {/* Topper Score */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-purple-600">
                  <span>Topper Score</span>
                  <span>{result.topperScore}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: `${result.topperScore}%` }} />
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Class Sample Size: 32 Students</span>
              <span>Confidence Range: 95%</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
