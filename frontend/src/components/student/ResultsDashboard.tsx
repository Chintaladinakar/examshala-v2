"use client";

import React, { useState, useMemo } from 'react';
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
  Clock, 
  Sparkles, 
  ChevronRight, 
  Download, 
  ArrowUpRight,
  HelpCircle
} from 'lucide-react';

// Dynamically import Recharts to prevent hydration errors during SSR
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer as any),
  { ssr: false }
) as any;
const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart as any),
  { ssr: false }
) as any;
const Line = dynamic(
  () => import('recharts').then((mod) => mod.Line as any),
  { ssr: false }
) as any;
const XAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis as any),
  { ssr: false }
) as any;
const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis as any),
  { ssr: false }
) as any;
const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid as any),
  { ssr: false }
) as any;
const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip as any),
  { ssr: false }
) as any;

interface ResultsDashboardProps {
  resultsData: any[];
}

export default function ResultsDashboard({ resultsData }: ResultsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

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
          // Assuming semester is last 6 months
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
      return { avgScore: 0, completed: 0, highest: 'N/A', highestVal: 0, rank: 'N/A' };
    }
    const completed = resultsData.filter(r => r.status !== 'Pending').length;
    const totalPercentage = resultsData.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    const avgScore = completed > 0 ? Math.round(totalPercentage / resultsData.length) : 0;

    let highestVal = 0;
    let highestSubject = 'N/A';
    resultsData.forEach(r => {
      if (r.percentage > highestVal) {
        highestVal = r.percentage;
        highestSubject = r.subject;
      }
    });

    // Best rank
    const ranks = resultsData.map(r => r.rank).filter(Boolean) as number[];
    const highestRank = ranks.length > 0 ? `#${Math.min(...ranks)}` : '#14';

    return {
      avgScore,
      completed,
      highest: `${highestSubject} - ${highestVal}%`,
      highestVal,
      rank: `${highestRank} in Class`
    };
  }, [resultsData]);

  // Chart Data preparation
  const chartData = useMemo(() => {
    return [...resultsData]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map(r => ({
        date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Math.round(r.percentage)
      }));
  }, [resultsData]);

  // Subject performance progress bars
  const subjectStats = useMemo(() => {
    const subjects = ['Math', 'Physics', 'Chemistry', 'Biology', 'English'];
    return subjects.map(sub => {
      const subResults = resultsData.filter(r => r.subject.toLowerCase() === sub.toLowerCase());
      if (subResults.length === 0) {
        return { name: sub, percentage: 0, color: 'bg-slate-300' };
      }
      const avg = Math.round(subResults.reduce((acc, curr) => acc + curr.percentage, 0) / subResults.length);
      
      let color = 'bg-rose-500';
      if (avg >= 90) color = 'bg-purple-500';
      else if (avg >= 80) color = 'bg-emerald-500';
      else if (avg >= 70) color = 'bg-indigo-500';
      else if (avg >= 60) color = 'bg-amber-500';

      return { name: sub, percentage: avg, color };
    });
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

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. HEADER SECTION */}
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-30 border border-slate-200/80 shadow-sm rounded-2xl p-6 transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">
              Academic Results
            </h1>
            <p className="text-slate-500 font-medium text-sm lg:text-base">
              Track exam performance, rankings, strengths, and improvement areas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject or exam..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full sm:w-60 font-medium text-slate-700"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:bg-slate-100 cursor-pointer text-slate-600"
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
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:bg-slate-100 cursor-pointer text-slate-600"
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="semester">This Semester</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PERFORMANCE SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD 1: Average Score */}
        <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-indigo-500 to-violet-500" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-sm font-bold text-slate-400 tracking-wide uppercase">Average Score</span>
              <h3 className="text-3xl font-black text-slate-800">{stats.avgScore}%</h3>
              <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+2.4% vs Last Term</span>
              </div>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* CARD 2: Exams Completed */}
        <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-sm font-bold text-slate-400 tracking-wide uppercase">Exams Completed</span>
              <h3 className="text-3xl font-black text-slate-800">{stats.completed} Exams</h3>
              <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>100% submission rate</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* CARD 3: Highest Score */}
        <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-purple-500 to-fuchsia-500" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-sm font-bold text-slate-400 tracking-wide uppercase">Highest Score</span>
              <h3 className="text-2xl font-black text-slate-800 truncate max-w-[190px]">{stats.highest}</h3>
              <div className="flex items-center gap-1 text-indigo-600 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                <span>Excellent Mastery</span>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* CARD 4: Current Rank */}
        <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-amber-500 to-orange-500" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-sm font-bold text-slate-400 tracking-wide uppercase">Current Rank</span>
              <h3 className="text-3xl font-black text-slate-800">{stats.rank}</h3>
              <div className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Up 3 positions</span>
              </div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

      </div>

      {/* 3. ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT CHART CARD (2 cols wide) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">Performance Over Time</h3>
              <p className="text-xs text-slate-400 font-medium">Visual analysis of percentage scores across exam schedules</p>
            </div>
            <div className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Real-time</span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.96)', 
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                    }} 
                    labelClassName="font-bold text-slate-800 text-xs"
                    formatter={(value: any) => [`${value}%`, 'Score']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium text-sm">
                No sufficient timeline data.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SUBJECT PERFORMANCE CARD (1 col wide) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-1 mb-6">
            <h3 className="text-lg font-bold text-slate-800">Subject Performance</h3>
            <p className="text-xs text-slate-400 font-medium">Average mastery percentages across core subjects</p>
          </div>

          <div className="space-y-5 flex-1">
            {subjectStats.map((sub, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-700">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" style={{ backgroundColor: sub.percentage > 0 ? undefined : '#cbd5e1' }} />
                    {sub.name}
                  </span>
                  <span className="text-slate-600 font-bold">{sub.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${sub.color}`} 
                    style={{ width: `${sub.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. RESULTS TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-800">Academic Records List</h3>
          <span className="text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
            Showing {filteredResults.length} records
          </span>
        </div>

        {filteredResults.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Exam</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Score</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Percentage</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Grade</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Rank</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.map((result) => {
                    const isExcellent = result.status === 'Excellent';
                    const isPassed = result.status === 'Passed';
                    const isFailed = result.status === 'Failed';
                    const isPending = result.status === 'Pending';

                    return (
                      <tr key={result.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {result.title}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="text-slate-500 font-semibold">{result.subject}</span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-slate-500">
                          {new Date(result.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="font-bold text-slate-800">{result.score}/{result.totalMarks}</span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="font-extrabold text-slate-800">{Math.round(result.percentage)}%</span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md text-xs">{result.grade}</span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="font-bold text-slate-600">#{result.rank || 'N/A'}</span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                            isExcellent ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            isPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            isPending ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {isPassed || isExcellent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {result.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right space-x-2">
                          <Link 
                            href={`/studentdashboard/results/${result.id}`}
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                          >
                            View Report
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                          <button 
                            onClick={() => handleDownloadPDF(result)}
                            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-800 font-bold text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            PDF
                          </button>
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
                <div key={result.id} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800">{result.title}</h4>
                      <p className="text-xs text-slate-400 font-semibold">{result.subject} &bull; {new Date(result.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md text-xs">{result.grade}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 text-center bg-white rounded-lg border border-slate-100">
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Score</span>
                      <span className="font-bold text-xs text-slate-800">{result.score}/{result.totalMarks}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Percent</span>
                      <span className="font-extrabold text-xs text-slate-800">{Math.round(result.percentage)}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 uppercase font-bold">Rank</span>
                      <span className="font-bold text-xs text-slate-600">#{result.rank || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      result.status === 'Excellent' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      result.status === 'Passed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      result.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {result.status}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDownloadPDF(result)}
                        className="p-2 text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
                        title="Download Report"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <Link 
                        href={`/studentdashboard/results/${result.id}`}
                        className="inline-flex items-center gap-1 text-white bg-indigo-600 hover:bg-indigo-700 font-bold text-xs px-3 py-2 rounded-lg transition-colors"
                      >
                        Report
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* 10. EMPTY STATE */
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400">
              <HelpCircle className="w-12 h-12" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-800">No exam results available yet</h4>
              <p className="text-sm text-slate-400 font-semibold max-w-sm">
                You haven't completed any exams matching the search terms or selected filters.
              </p>
            </div>
            <Link 
              href="/studentdashboard/exams"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10"
            >
              Go to Exams
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
