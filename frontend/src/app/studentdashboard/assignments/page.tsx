'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { 
  FolderOpen, 
  Search, 
  BookOpen, 
  Clock, 
  Calendar, 
  User, 
  CheckCircle, 
  AlertCircle, 
  Hourglass, 
  ArrowUpDown, 
  ChevronRight, 
  RefreshCw 
} from 'lucide-react';

type Assignment = {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  attachments: string[];
  marks: number | null;
  teacherName: string;
  status: 'Pending' | 'Submitted' | 'Late' | 'Graded';
};

type Stats = {
  pending: number;
  submitted: number;
  overdue: number;
  upcoming: number;
};

export default function AssignmentsDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, submitted: 0, overdue: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering & Sorting State
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isPending, startTransition] = useTransition();

  const getCookie = (name: string) => {
    if (typeof window === 'undefined') return '';
    return document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`))
      ?.split('=')[1] || '';
  };

  const fetchStats = async (token: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/assignments/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await res.json();
      if (payload.success) {
        setStats(payload.data);
      }
    } catch (e) {
      console.error('Failed to fetch stats', e);
    }
  };

  const fetchAssignments = async () => {
    const token = getCookie('session_token');
    if (!token) {
      setError('Unauthorized access. Please log in.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      fetchStats(token);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '6',
        search,
        subject,
        status,
        sortBy
      });

      const res = await fetch(`http://localhost:5000/api/assignments?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await res.json();
      
      if (payload.success) {
        setAssignments(payload.data);
        setTotalPages(payload.pagination?.totalPages || 1);
        setError('');
      } else {
        setError(payload.message || 'Failed to load assignments.');
      }
    } catch (e) {
      setError('Connection to backend failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [page, subject, status, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAssignments();
  };

  const subjectsList = ['Mathematics', 'Science', 'English', 'History', 'Computer Science', 'Physics', 'Chemistry'];

  // Status Styling helpers
  const getStatusStyle = (state: string) => {
    switch (state) {
      case 'Submitted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Late':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Graded':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Pending':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getRemainingTime = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    if (diffMs < 0) return 'Overdue';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Assignments Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your active schoolwork, deadlines, and submissions.</p>
        </div>
        <button 
          onClick={fetchAssignments}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl shadow-xs transition-colors self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Hourglass className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Pending</div>
            <div className="text-lg font-bold text-slate-800">{stats.pending}</div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Submitted</div>
            <div className="text-lg font-bold text-slate-800">{stats.submitted}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Overdue</div>
            <div className="text-lg font-bold text-slate-800">{stats.overdue}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Upcoming</div>
            <div className="text-lg font-bold text-slate-800">{stats.upcoming}</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search assignments by title..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <button 
            type="submit"
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-3 items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex flex-wrap gap-2">
            <select 
              value={subject} 
              onChange={(e) => { setSubject(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
            >
              <option value="">All Subjects</option>
              {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select 
              value={status} 
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Submitted">Submitted</option>
              <option value="Late">Late</option>
              <option value="Graded">Graded</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
            >
              <option value="latest">Sort by: Latest</option>
              <option value="dueDate">Sort by: Due Date</option>
              <option value="subject">Sort by: Subject</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main List Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs animate-pulse space-y-4">
              <div className="h-4 w-1/3 bg-slate-100 rounded-md"></div>
              <div className="h-5 w-3/4 bg-slate-200 rounded-md"></div>
              <div className="h-3 w-1/2 bg-slate-100 rounded-md"></div>
              <div className="flex gap-2 pt-2 border-t border-slate-50">
                <div className="h-8 w-20 bg-slate-100 rounded-lg"></div>
                <div className="h-8 w-20 bg-slate-100 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">{error}</div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mb-4 text-teal-600">
            <FolderOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Assignments Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">There are no assignments matching your current search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map(assignment => (
            <div 
              key={assignment.id} 
              className="group bg-white p-5 rounded-2xl border border-slate-100/80 shadow-3xs hover:shadow-2xs transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
                    {assignment.subject}
                  </span>
                  <span className={`text-[10px] font-bold border px-2.5 py-1 rounded-lg ${getStatusStyle(assignment.status)}`}>
                    {assignment.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-800 tracking-tight group-hover:text-teal-950 transition-colors">
                  {assignment.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {assignment.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {assignment.teacherName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due {new Date(assignment.dueDate).toLocaleDateString()}
                  </span>
                  {assignment.status !== 'Submitted' && assignment.status !== 'Graded' && (
                    <span className="flex items-center gap-1 text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5" /> {getRemainingTime(assignment.dueDate)}
                    </span>
                  )}
                </div>

                {assignment.marks !== null && (
                  <div className="text-[11px] font-bold text-teal-700 bg-teal-50/60 inline-flex px-2 py-0.5 rounded-md mt-2">
                    Marks: {assignment.marks} pts
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 mt-4 border-t border-slate-100">
                <Link 
                  href={`/studentdashboard/assignments/${assignment.id}`}
                  className="flex-1 text-center py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  View Details
                </Link>
                {assignment.status === 'Pending' && (
                  <Link 
                    href={`/studentdashboard/assignments/${assignment.id}`}
                    className="flex-1 text-center py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Submit Assignment
                  </Link>
                )}
                {assignment.status === 'Submitted' && new Date() < new Date(assignment.dueDate) && (
                  <Link 
                    href={`/studentdashboard/assignments/${assignment.id}`}
                    className="flex-1 text-center py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Edit Submission
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-opacity cursor-pointer"
          >
            Previous
          </button>
          <span className="text-xs font-medium text-slate-500 px-2">Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 transition-opacity cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
