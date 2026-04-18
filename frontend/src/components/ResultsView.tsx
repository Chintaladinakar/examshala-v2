"use client";

import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar, TrendingUp, CheckCircle, XCircle, Award } from 'lucide-react';

interface ResultsViewProps {
  role: string | 'student' | 'tutor' | 'manager';
  resultsData: any[]; // Depending on role, this might be a list of student results or a list of class results
}

export default function ResultsView({ role, resultsData }: ResultsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Dummy fallback data if empty for frontend demonstration of rich UI
  const data = resultsData.length > 0 ? resultsData : [
    {
      id: '1',
      studentName: 'Amit Kumar',
      testName: 'Mathematics Final Exam',
      score: 85,
      maxScore: 100,
      status: 'evaluated',
      evaluatedAt: '2026-04-10T10:00:00Z',
    },
    {
      id: '2',
      studentName: 'Priya Sharma',
      testName: 'Physics Mid-Term',
      score: 92,
      maxScore: 100,
      status: 'evaluated',
      evaluatedAt: '2026-04-12T14:30:00Z',
    },
    {
      id: '3',
      studentName: 'Rahul Verma',
      testName: 'Chemistry Unit Test',
      score: 74,
      maxScore: 100,
      status: 'evaluated',
      evaluatedAt: '2026-04-14T09:15:00Z',
    },
    {
      id: '4',
      studentName: 'Sneha Patel',
      testName: 'Biology Assessment',
      score: 88,
      maxScore: 100,
      status: 'evaluated',
      evaluatedAt: '2026-04-15T11:45:00Z',
    },
  ];

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.testName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (item.studentName?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, statusFilter, dateFilter]);

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Filters Section */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-sm rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Exam Results
            </h1>
            <p className="text-slate-500 text-sm">
              {role === 'student' ? 'Track your performance and progress over time.' : 'Monitor student performance and analytics.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder={role === 'student' ? "Search exams..." : "Search students or exams..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full md:w-64"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:bg-slate-100 cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="evaluated">Evaluated</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all hover:bg-slate-100 cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Year</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area Based on Role */}
      {role === 'student' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((result, idx) => {
            const percentage = ((result.score / result.maxScore) * 100).toFixed(1);
            const isHighScorer = Number(percentage) >= 80;
            return (
              <div 
                key={result.id || idx} 
                className="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 -mr-2 -mt-2">
                  {isHighScorer && (
                    <div className="bg-gradient-to-tr from-amber-400 to-yellow-300 p-2 rounded-full shadow-lg border border-amber-200 animate-bounce">
                      <Award className="w-4 h-4 text-amber-800" />
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                  {result.testName}
                </h3>
                <p className="text-sm text-slate-500 mb-4 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(result.evaluatedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>

                <div className="flex items-end justify-between bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100 group-hover:bg-indigo-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Score</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-800">{result.score}</span>
                      <span className="text-slate-400">/ {result.maxScore}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-500 mb-1">Percentage</p>
                    <span className={`text-lg font-bold ${isHighScorer ? 'text-emerald-600' : 'text-indigo-600'}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 mb-4 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${isHighScorer ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-4 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors text-center">
                    View Details
                  </button>
                  <button className="flex-1 py-2 px-4 rounded-xl text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors text-center">
                    Analytics
                  </button>
                </div>
              </div>
            );
          })}
          {filteredData.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <Filter className="w-12 h-12 mb-3 text-slate-300" />
              <p>No results match your filters.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Name</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assessment</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((result, idx) => {
                  const percentage = ((result.score / result.maxScore) * 100).toFixed(1);
                  return (
                    <tr key={result.id || idx} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {result.studentName?.charAt(0) || 'S'}
                          </div>
                          <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{result.studentName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="text-slate-600 font-medium">{result.testName}</span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{result.score}/{result.maxScore}</span>
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-500">
                            {percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          result.status === 'evaluated' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {result.status === 'evaluated' ? <CheckCircle className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                          {result.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-500">
                        {new Date(result.evaluatedAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div className="w-full py-12 flex flex-col items-center justify-center text-slate-400">
                <Filter className="w-12 h-12 mb-3 text-slate-300" />
                <p>No results match your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
