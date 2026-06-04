"use client";

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Award, 
  User, 
  BookOpen, 
  Clock, 
  ArrowRight,
  Printer,
  ChevronRight,
  Sparkles,
  X,
  FileText,
  BadgeAlert
} from 'lucide-react';

interface ResultsViewProps {
  role: string;
  resultsData: any[];
}

export default function ResultsView({ role, resultsData }: ResultsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Fallback data if backend is empty
  const data = useMemo(() => {
    if (resultsData && resultsData.length > 0) return resultsData;

    return [
      {
        id: 'res-1',
        studentName: 'Amit Kumar',
        studentEmail: 'amit.kumar@student.com',
        testName: 'Mathematics Algebra Mid-Term',
        subject: 'Mathematics',
        score: 92,
        maxScore: 100,
        percentage: 92.0,
        grade: 'A+',
        status: 'evaluated',
        feedback: 'Superb understanding of linear equations and matrices.',
        timeTaken: 48,
        evaluatedAt: '2026-05-20T10:00:00Z',
      },
      {
        id: 'res-2',
        studentName: 'Priya Sharma',
        studentEmail: 'priya.sharma@student.com',
        testName: 'Physics Wave Mechanics Quiz',
        subject: 'Physics',
        score: 86,
        maxScore: 100,
        percentage: 86.0,
        grade: 'A',
        status: 'evaluated',
        feedback: 'Strong grasp of harmonics. Review wave propagation formulas.',
        timeTaken: 40,
        evaluatedAt: '2026-05-22T14:30:00Z',
      },
      {
        id: 'res-3',
        studentName: 'Rahul Verma',
        studentEmail: 'rahul.verma@student.com',
        testName: 'Chemistry Organic Reactions Assessment',
        subject: 'Chemistry',
        score: 74,
        maxScore: 100,
        percentage: 74.0,
        grade: 'B',
        status: 'evaluated',
        feedback: 'Good attempt. Needs improvements in aromatic compound conversions.',
        timeTaken: 55,
        evaluatedAt: '2026-05-25T09:15:00Z',
      },
      {
        id: 'res-4',
        studentName: 'Sneha Patel',
        studentEmail: 'sneha.patel@student.com',
        testName: 'Biology Genetics Fundamentals',
        subject: 'Biology',
        score: 95,
        maxScore: 100,
        percentage: 95.0,
        grade: 'A+',
        status: 'evaluated',
        feedback: 'Flawless analysis of Mendelian inheritance patterns.',
        timeTaken: 38,
        evaluatedAt: '2026-05-28T11:45:00Z',
      },
      {
        id: 'res-5',
        studentName: 'Kabir Dev',
        studentEmail: 'kabir.dev@student.com',
        testName: 'Mathematics Algebra Mid-Term',
        subject: 'Mathematics',
        score: 58,
        maxScore: 100,
        percentage: 58.0,
        grade: 'C-',
        status: 'evaluated',
        feedback: 'Requires remedial practice in polynomial equations.',
        timeTaken: 59,
        evaluatedAt: '2026-05-20T10:00:00Z',
      }
    ];
  }, [resultsData]);

  // Calculations for KPIs
  const kpis = useMemo(() => {
    if (data.length === 0) return { avg: 0, passRate: 0, highest: 0, highScorers: 0 };
    
    const scores = data.map(r => r.score);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / data.length);
    const highest = Math.max(...scores);
    const passCount = data.filter(r => (r.score / r.maxScore) * 100 >= 60).length;
    const passRate = Math.round((passCount / data.length) * 100);
    const highScorers = data.filter(r => (r.score / r.maxScore) * 100 >= 85).length;

    return { avg, passRate, highest, highScorers };
  }, [data]);

  // Filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const name = item.studentName || '';
      const exam = item.testName || item.subject || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            exam.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, statusFilter, dateFilter]);

  const handlePrintScorecard = () => {
    window.print();
  };

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 select-none">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-teal-800" />
            Workspace Results Audit
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
            Review academic analytics, view student report cards, and analyze graded test logs.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs flex items-center gap-4 hover:shadow-2xs transition-shadow duration-300">
          <div className="w-10 h-10 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center text-teal-700">
            <Award className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Workspace Average</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{kpis.avg}%</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs flex items-center gap-4 hover:shadow-2xs transition-shadow duration-300">
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-700">
            <TrendingUp className="w-5 h-5 text-indigo-700" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pass Rate</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{kpis.passRate}%</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs flex items-center gap-4 hover:shadow-2xs transition-shadow duration-300">
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
            <CheckCircle className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">High Scorers (≥85%)</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{kpis.highScorers}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs flex items-center gap-4 hover:shadow-2xs transition-shadow duration-300">
          <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-700">
            <Sparkles className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Highest Score</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">{kpis.highest}%</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 border border-slate-200 rounded-2xl shadow-3xs">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={role === 'student' ? "Search results by subject..." : "Search by student name or assessment..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700/35 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 self-end md:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-xl bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="evaluated">Evaluated</option>
            <option value="pending">Pending Review</option>
          </select>
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Assessment / Exam</th>
                <th className="px-6 py-4">Marks (Score / Max)</th>
                <th className="px-6 py-4">Percentage</th>
                <th className="px-6 py-4">Grade</th>
                <th className="px-6 py-4">Evaluated Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-extrabold text-slate-500">No results found</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Adjust filter criteria or sync database.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((result, idx) => {
                  const percentage = ((result.score / result.maxScore) * 100).toFixed(1);
                  const isHigh = Number(percentage) >= 80;
                  const isLow = Number(percentage) < 60;
                  const initials = result.studentName ? result.studentName.split(' ').map((w: any) => w[0]).join('').slice(0, 2).toUpperCase() : 'ST';

                  return (
                    <tr key={result.id || idx} className="hover:bg-slate-50/50 transition-all text-xs text-slate-700">
                      {/* Student details */}
                      <td className="px-6 py-4 font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-800 text-teal-100 flex items-center justify-center font-bold text-[10px] uppercase shrink-0 shadow-inner">
                            {initials}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-800 leading-snug">{result.studentName || 'Student'}</h4>
                            <p className="text-[9px] text-slate-400 font-semibold leading-none mt-0.5">{result.studentEmail || '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Assessment Name */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-slate-800">{result.testName || 'Assessment'}</h4>
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase bg-slate-100 border px-1.5 py-0.5 rounded">
                            {result.subject || 'General'}
                          </span>
                        </div>
                      </td>

                      {/* Score / Max Score */}
                      <td className="px-6 py-4">
                        <div className="flex items-baseline gap-0.5 font-bold">
                          <span className="text-slate-850 text-sm font-black">{result.score}</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-500">{result.maxScore}</span>
                        </div>
                      </td>

                      {/* Percentage Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                          isHigh
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : isLow
                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                          {percentage}%
                        </span>
                      </td>

                      {/* Grade Badge */}
                      <td className="px-6 py-4 font-black">
                        <span className="text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/50">
                          {result.grade || 'A'}
                        </span>
                      </td>

                      {/* Evaluated Date */}
                      <td className="px-6 py-4 text-slate-400 font-bold">
                        {new Date(result.evaluatedAt || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedResult(result);
                            setDetailModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-teal-250 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[10px] rounded-lg transition-all cursor-pointer shadow-3xs"
                        >
                          Review <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── DETAILED SCORECARD MODAL ─────────────────────────────────────────── */}
      {detailModalOpen && selectedResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none">
            {/* Header */}
            <div className="bg-teal-950 p-6 text-white flex items-center justify-between select-none print:hidden">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Award className="w-5 h-5 text-teal-400 animate-pulse" /> Student Academic Scorecard
                </h3>
                <p className="text-[10px] text-teal-200 mt-0.5 font-semibold">
                  Comprehensive performance audit and assessment records.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintScorecard}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-teal-250 hover:text-white transition-colors cursor-pointer"
                  title="Print Report Card"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setDetailModalOpen(false)} 
                  className="p-1.5 hover:bg-white/5 rounded-lg text-teal-250 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scorecard Content */}
            <div className="p-8 overflow-y-auto space-y-6 flex-1 text-slate-700 bg-white" id="scorecard-printable">
              
              {/* Institution Stamp */}
              <div className="text-center pb-4 border-b border-dashed border-slate-200 select-none">
                <div className="w-10 h-10 bg-teal-950 text-white font-black rounded-xl flex items-center justify-center text-lg mx-auto shadow-md">
                  E
                </div>
                <h4 className="font-extrabold text-slate-900 mt-2 text-sm tracking-wide uppercase leading-none">EDUsphere Academy</h4>
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Official Student Performance Report</p>
              </div>

              {/* Candidate Info Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-200/60 rounded-2xl text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Candidate Details</span>
                  <h4 className="font-black text-slate-800 text-sm mt-0.5">{selectedResult.studentName}</h4>
                  <p className="text-slate-500 font-semibold leading-none mt-0.5">{selectedResult.studentEmail}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Assessment Scope</span>
                  <h4 className="font-black text-slate-800 text-sm mt-0.5">{selectedResult.testName}</h4>
                  <p className="text-slate-500 font-semibold leading-none mt-0.5">Subject: {selectedResult.subject}</p>
                </div>
              </div>

              {/* Performance Stats Ring Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-slate-200 p-4 rounded-2xl text-center bg-slate-50/50">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Obtained Score</span>
                  <span className="text-2xl font-black text-slate-800 block mt-1">
                    {selectedResult.score}
                    <span className="text-xs font-normal text-slate-400">/{selectedResult.maxScore}</span>
                  </span>
                </div>

                <div className="border border-slate-200 p-4 rounded-2xl text-center bg-slate-50/50">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Percentage</span>
                  <span className="text-2xl font-black text-teal-700 block mt-1">
                    {((selectedResult.score / selectedResult.maxScore) * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="border border-slate-200 p-4 rounded-2xl text-center bg-slate-50/50">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Final Grade</span>
                  <span className="text-2xl font-black text-slate-800 block mt-1">{selectedResult.grade}</span>
                </div>
              </div>

              {/* Progress bar visualizer */}
              <div className="space-y-1.5 select-none">
                <div className="flex justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">
                  <span>Score distribution</span>
                  <span>{((selectedResult.score / selectedResult.maxScore) * 100).toFixed(1)}% of max marks</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/50">
                  <div 
                    className="bg-teal-700 h-2.5 rounded-full transition-all duration-1000"
                    style={{ width: `${((selectedResult.score / selectedResult.maxScore) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Audit Details (time taken, date, examiner comments) */}
              <div className="space-y-4 border-t pt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Audit Metrics</span>
                
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Time Taken: <strong className="text-slate-800">{selectedResult.timeTaken || '35'} Mins</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Graded At: <strong className="text-slate-800">{new Date(selectedResult.evaluatedAt || Date.now()).toLocaleDateString()}</strong></span>
                  </div>
                </div>
              </div>

              {/* Remarks/Feedback */}
              <div className="space-y-2 border-t pt-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Assessor Feedback</span>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs font-medium italic leading-relaxed text-slate-600">
                  "{selectedResult.feedback || 'No assessor feedback provided for this scorecard.'}"
                </div>
              </div>

            </div>

            {/* Print Friendly Footer warning */}
            <div className="hidden print:block text-center text-[9px] text-slate-400 border-t pt-4 pb-6 select-none font-semibold">
              This is a computer generated scorecard certified by EDUsphere Analytics System.
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2 print:hidden select-none">
              <button
                onClick={handlePrintScorecard}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print Card
              </button>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
