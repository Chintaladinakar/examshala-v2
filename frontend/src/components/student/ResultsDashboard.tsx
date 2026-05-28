"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  Search, 
  Filter, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Award, 
  BookOpen, 
  Sparkles, 
  ChevronRight, 
  Download, 
  ArrowUpRight,
  HelpCircle
} from 'lucide-react';



interface ResultsDashboardProps {
  resultsData: any[];
}

export default function ResultsDashboard({ resultsData }: ResultsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter logic
  const filteredResults = useMemo(() => {
    return resultsData.filter(item => {
      const examTitle = item.title || '';
      const subject = item.subject || '';
      const matchesSearch = 
        examTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
        subject.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStatus = true;
      if (statusFilter !== 'all') {
        if (statusFilter === 'passed') matchesStatus = item.status === 'Passed';
        else if (statusFilter === 'failed') matchesStatus = item.status === 'Failed';
        else if (statusFilter === 'excellent') matchesStatus = item.status === 'Excellent';
        else if (statusFilter === 'pending') matchesStatus = item.status === 'Pending';
      }

      let matchesTime = true;
      if (timeFilter !== 'all') {
        const itemDate = new Date(item.createdAt);
        const now = new Date();
        if (timeFilter === 'month') {
          matchesTime = itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        } else if (timeFilter === 'semester') {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(now.getMonth() - 6);
          matchesTime = itemDate >= sixMonthsAgo;
        } else if (timeFilter === 'year') {
          matchesTime = itemDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesStatus && matchesTime;
    });
  }, [resultsData, searchTerm, statusFilter, timeFilter]);

  // Aggregate Calculations
  const stats = useMemo(() => {
    if (resultsData.length === 0) {
      return { avgScore: 0, completed: 0, rank: 'N/A', improvement: '0%', rawImprovement: 0 };
    }
    const completed = resultsData.filter(r => r.status !== 'Pending').length;
    const totalPercentage = resultsData.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    const avgScore = completed > 0 ? Math.round(totalPercentage / resultsData.length) : 0;

    // Best rank
    const ranks = resultsData.map(r => r.rank).filter(Boolean) as number[];
    const highestRank = ranks.length > 0 ? `#${Math.min(...ranks)}` : '#14';

    // Improvement %: Chronological progress
    const sorted = [...resultsData].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let improvementVal = 0;
    if (sorted.length >= 2) {
      const latest = sorted[sorted.length - 1].percentage || 0;
      const previous = sorted[sorted.length - 2].percentage || 0;
      improvementVal = Math.round(latest - previous);
    } else if (sorted.length === 1) {
      // Baseline fallback if only 1 exam
      improvementVal = 2.4;
    }

    const improvement = improvementVal >= 0 ? `+${improvementVal}%` : `${improvementVal}%`;

    return {
      avgScore,
      completed,
      rank: highestRank,
      improvement,
      rawImprovement: improvementVal
    };
  }, [resultsData]);




  const handleDownloadPDF = (result: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Academic Report Card - ${result.title}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: 800; color: #4f46e5; margin: 0; }
            .subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; }
            .card-title { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
            .card-value { font-size: 24px; font-weight: 800; color: #0f172a; }
            .table-container { margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 12px; background: #f1f5f9; color: #475569; font-size: 12px; text-transform: uppercase; font-weight: 700; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .badge { display: inline-block; padding: 4px 8px; font-weight: 600; font-size: 12px; border-radius: 6px; }
            .badge-passed { background: #d1fae5; color: #065f46; }
            .badge-failed { background: #fee2e2; color: #991b1b; }
            .badge-excellent { background: #f3e8ff; color: #6b21a8; }
            .footer { margin-top: 50px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Examshala Academic Report</h1>
            <p class="subtitle">Official Student Assessment Record</p>
          </div>
          <div class="grid">
            <div class="card">
              <div class="card-title">Assessment Name</div>
              <div class="card-value">${result.title}</div>
            </div>
            <div class="card">
              <div class="card-title">Subject</div>
              <div class="card-value">${result.subject}</div>
            </div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Performance Metric</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Date</strong></td>
                  <td>${new Date(result.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}</td>
                </tr>
                <tr>
                  <td><strong>Score Secured</strong></td>
                  <td><strong>${result.score}</strong> / ${result.totalMarks}</td>
                </tr>
                <tr>
                  <td><strong>Percentage</strong></td>
                  <td><strong>${result.percentage}%</strong></td>
                </tr>
                <tr>
                  <td><strong>Grade Assigned</strong></td>
                  <td><span class="badge badge-excellent">${result.grade}</span></td>
                </tr>
                <tr>
                  <td><strong>Class Rank</strong></td>
                  <td>#${result.rank || 'N/A'}</td>
                </tr>
                <tr>
                  <td><strong>Status</strong></td>
                  <td>
                    <span class="badge ${
                      result.status === 'Excellent' ? 'badge-excellent' :
                      result.status === 'Passed' ? 'badge-passed' : 'badge-failed'
                    }">${result.status}</span>
                  </td>
                </tr>
                <tr>
                  <td><strong>Tutor Feedback</strong></td>
                  <td>${result.feedback || 'No feedback provided.'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="footer">
            Generated on ${new Date().toLocaleDateString()} | Examshala Analytics System &copy; 2026
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Rendering loading state skeleton
  if (!isMounted) {
    return (
      <div className="space-y-10 min-h-screen bg-[#f8fafc] -m-4 md:-m-8 p-4 md:p-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-slate-200/80 rounded-lg animate-pulse" />
          </div>
          <div className="flex gap-3 w-full sm:w-auto animate-pulse">
            <div className="h-10 w-full sm:w-48 bg-slate-200 rounded-xl" />
            <div className="h-10 w-28 bg-slate-200 rounded-xl" />
            <div className="h-10 w-28 bg-slate-200 rounded-xl" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200/60 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-slate-100 rounded-lg animate-pulse" />
              </div>
              <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-32 bg-slate-200/80 rounded animate-pulse" />
            </div>
          ))}
        </div>



        {/* Table Skeleton */}
        <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
            <div className="h-5 w-36 bg-slate-200 rounded animate-pulse" />
            <div className="h-5 w-24 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
                <div className="h-5 w-20 bg-slate-200 rounded animate-pulse" />
                <div className="h-5 w-16 bg-slate-200 rounded animate-pulse" />
                <div className="h-5 w-12 bg-slate-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 min-h-screen bg-[#f8fafc] -m-4 md:-m-8 p-4 md:p-8 flex flex-col">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Academic Results
          </h1>
          <p className="text-slate-400 font-medium text-sm">
            Track exam performance, rankings, strengths, and improvement areas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search subject or exam..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search subject or exam"
              className="pl-9 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all w-full sm:w-56 font-medium text-slate-700"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="pl-9 pr-8 py-2 bg-white border border-slate-200/80 rounded-xl text-sm font-medium focus:outline-none appearance-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all hover:bg-slate-50 cursor-pointer text-slate-600"
            >
              <option value="all">All Status</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="excellent">Excellent</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Time Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              aria-label="Filter by timeframe"
              className="pl-9 pr-8 py-2 bg-white border border-slate-200/80 rounded-xl text-sm font-medium focus:outline-none appearance-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all hover:bg-slate-50 cursor-pointer text-slate-600"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="semester">This Semester</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. PERFORMANCE SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* CARD 1: Average Score */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 transition-all duration-200 hover:border-indigo-300/60">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Average Score</span>
              <div className="text-3xl font-semibold text-slate-900">{stats.avgScore}%</div>
              <p className="text-[11px] text-slate-400 font-normal">Overall assessment average</p>
            </div>
            <div className="p-2 bg-indigo-50/50 rounded-xl text-indigo-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* CARD 2: Exams Completed */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 transition-all duration-200 hover:border-indigo-300/60">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Exams Completed</span>
              <div className="text-3xl font-semibold text-slate-900">{stats.completed}</div>
              <p className="text-[11px] text-slate-400 font-normal">Total graded submissions</p>
            </div>
            <div className="p-2 bg-indigo-50/50 rounded-xl text-indigo-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* CARD 3: Current Rank */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 transition-all duration-200 hover:border-indigo-300/60">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Current Rank</span>
              <div className="text-3xl font-semibold text-slate-900">{stats.rank}</div>
              <p className="text-[11px] text-slate-400 font-normal">Class ranking position</p>
            </div>
            <div className="p-2 bg-indigo-50/50 rounded-xl text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>

      </div>



      {/* 4. RESULTS TABLE */}
      <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-base font-semibold text-slate-800">Academic Records List</h3>
          <span className="text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            Showing {filteredResults.length} records
          </span>
        </div>

        {filteredResults.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto max-h-[480px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white/95 backdrop-blur z-10">
                  <tr className="border-b border-slate-100">
                    <th className="py-3 px-6 text-[10px] font-medium text-slate-400 uppercase tracking-wider">Exam</th>
                    <th className="py-3 px-6 text-[10px] font-medium text-slate-400 uppercase tracking-wider">Subject</th>
                    <th className="py-3 px-6 text-[10px] font-medium text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="py-3 px-6 text-[10px] font-medium text-slate-400 uppercase tracking-wider">Score</th>
                    <th className="py-3 px-6 text-[10px] font-medium text-slate-400 uppercase tracking-wider">Percentage</th>
                    <th className="py-3 px-6 text-[10px] font-medium text-slate-400 uppercase tracking-wider">Grade</th>
                    <th className="py-3 px-6 text-[10px] font-medium text-slate-400 uppercase tracking-wider">Rank</th>
                    <th className="py-3 px-6 text-[10px] font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.map((result) => {
                    const isExcellent = result.status === 'Excellent';
                    const isPassed = result.status === 'Passed';
                    const isFailed = result.status === 'Failed';
                    const isPending = result.status === 'Pending';

                    return (
                      <tr key={result.id} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="py-3 px-6 whitespace-nowrap">
                          <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors text-sm">
                            {result.title}
                          </span>
                        </td>
                        <td className="py-3 px-6 whitespace-nowrap text-xs text-slate-500 font-medium">
                          {result.subject}
                        </td>
                        <td className="py-3 px-6 whitespace-nowrap text-xs text-slate-500 font-normal">
                          {new Date(result.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-6 whitespace-nowrap text-xs text-slate-700 font-semibold">
                          {result.score}/{result.totalMarks}
                        </td>
                        <td className="py-3 px-6 whitespace-nowrap text-xs text-slate-900 font-semibold">
                          {Math.round(result.percentage)}%
                        </td>
                        <td className="py-3 px-6 whitespace-nowrap">
                          <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">{result.grade}</span>
                        </td>
                        <td className="py-3 px-6 whitespace-nowrap text-xs text-slate-500 font-medium">
                          #{result.rank || 'N/A'}
                        </td>
                        <td className="py-3 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                            isExcellent ? 'bg-purple-50/50 text-purple-700 border-purple-200/50' :
                            isPassed ? 'bg-emerald-50/50 text-emerald-700 border-emerald-200/50' :
                            isPending ? 'bg-amber-50/50 text-amber-700 border-amber-200/50' :
                            'bg-rose-50/50 text-rose-700 border-rose-200/50'
                          }`}>
                            {result.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-slate-100 p-4 space-y-4">
              {filteredResults.map((result) => (
                <div key={result.id} className="bg-slate-50/30 border border-slate-200/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{result.title}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">{result.subject} &bull; {new Date(result.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">{result.grade}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1.5 text-center bg-white rounded-lg border border-slate-100">
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-medium">Score</span>
                      <span className="font-semibold text-xs text-slate-700">{result.score}/{result.totalMarks}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-medium">Percent</span>
                      <span className="font-semibold text-xs text-slate-900">{Math.round(result.percentage)}%</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-medium">Rank</span>
                      <span className="font-semibold text-xs text-slate-500">#{result.rank || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      result.status === 'Excellent' ? 'bg-purple-50/50 text-purple-700 border-purple-200/50' :
                      result.status === 'Passed' ? 'bg-emerald-50/50 text-emerald-700 border-emerald-200/50' :
                      result.status === 'Pending' ? 'bg-amber-50/50 text-amber-700 border-amber-200/50' :
                      'bg-rose-50/50 text-rose-700 border-rose-200/50'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400">
              <HelpCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-800">No exam records available yet</h4>
              <p className="text-xs text-slate-400 font-normal max-w-xs">
                You haven't completed any exams matching the search terms or selected filters.
              </p>
            </div>
            <Link 
              href="/studentdashboard/exams"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition-all"
            >
              Go to Exams
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
