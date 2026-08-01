'use client';

import React, { useEffect, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import { Trophy, RefreshCw, XCircle, FileText, Users, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type InstitutionSummary = {
  totalExams: number;
  statusCounts: Record<string, number>;
  pendingReviewCount: number;
  totalAttempts: number;
  averagePercentage: number;
  passRate: number;
  classAverages: { classId: string; className: string; averagePercentage: number; attempts: number }[];
  subjectAverages: { subject: string; averagePercentage: number; attempts: number }[];
  topPerformers: { studentId: string; studentName: string; percentage: number; examId: string }[];
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || 'Server operation failed');
  }
  return body.data as T;
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="bg-white border p-5 rounded-2xl shadow-3xs flex items-center gap-4">
      <div className="w-10 h-10 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center text-teal-750">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{title}</p>
        <p className="text-xl font-black text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function PrincipalResultsPage() {
  const { user } = useUser();
  const { showError } = useToast();
  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [data, setData] = useState<InstitutionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const res = await apiJson<InstitutionSummary>('/api/principal/results');
      setData(res);
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isPrincipalMode) loadData();
  }, [isPrincipalMode]);

  if (!isPrincipalMode) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 p-8 flex flex-col justify-center items-center">
          <div className="bg-white border p-12 rounded-3xl shadow-xl max-w-md text-center space-y-4">
            <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-black text-slate-800">Access Denied</h2>
            <p className="text-slate-500 text-sm leading-relaxed">This dashboard is exclusive to Principals.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto select-none">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Trophy className="w-8 h-8 text-teal-800" />
                Institution Results
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Performance analytics rolled up across every exam and class.
              </p>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3.5 py-2 border hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {loading && (
            <div className="bg-white border rounded-3xl p-12 text-center text-xs font-bold text-slate-400">Loading analytics…</div>
          )}

          {!loading && data && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title="Total Exams" value={data.totalExams} icon={FileText} />
                <StatCard title="Total Attempts" value={data.totalAttempts} icon={Users} />
                <StatCard title="Average Score" value={`${data.averagePercentage}%`} icon={TrendingUp} />
                <StatCard title="Pass Rate" value={`${data.passRate}%`} icon={Trophy} />
                <StatCard title="Pending Reviews" value={data.pendingReviewCount} icon={Clock} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-3xl p-6 shadow-3xs">
                  <h3 className="text-sm font-black text-slate-800 mb-4">Average Score by Class</h3>
                  {data.classAverages.length === 0 ? (
                    <p className="text-xs text-slate-400 font-semibold py-8 text-center">No evaluated attempts yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={data.classAverages}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="className" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="averagePercentage" fill="#0f766e" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="bg-white border rounded-3xl p-6 shadow-3xs">
                  <h3 className="text-sm font-black text-slate-800 mb-4">Average Score by Subject</h3>
                  {data.subjectAverages.length === 0 ? (
                    <p className="text-xs text-slate-400 font-semibold py-8 text-center">No evaluated attempts yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={data.subjectAverages}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="averagePercentage" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="bg-white border rounded-3xl shadow-3xs overflow-hidden">
                <div className="p-4 px-6 border-b">
                  <h3 className="text-sm font-black text-slate-800">Top Performers</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-6 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.topPerformers.length === 0 && (
                        <tr><td colSpan={3} className="px-6 py-8 text-center text-xs text-slate-400 font-semibold">No evaluated attempts yet.</td></tr>
                      )}
                      {data.topPerformers.map((p, idx) => (
                        <tr key={`${p.studentId}-${p.examId}`} className="hover:bg-slate-50/60">
                          <td className="px-6 py-2.5 text-xs font-black text-slate-800">#{idx + 1}</td>
                          <td className="px-6 py-2.5 text-xs font-bold text-slate-700">{p.studentName}</td>
                          <td className="px-6 py-2.5 text-xs font-black text-emerald-600">{p.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
