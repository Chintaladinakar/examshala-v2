'use client';

import React, { useMemo, useState } from 'react';
import { CalendarCheck, CalendarX, TrendingUp } from 'lucide-react';

type AttendanceRecord = {
  id: string;
  date: string;
  status: string;
  classId: string;
  className: string;
};

type ClassSummary = {
  classId: string;
  className: string;
  total: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number | null;
};

type AttendanceData = {
  overallAttendanceRate: number | null;
  totalRecords: number;
  totalPresent: number;
  totalAbsent: number;
  byClass: ClassSummary[];
  records: AttendanceRecord[];
};

export function AttendanceInteractive({ initialData }: { initialData: AttendanceData }) {
  const [classFilter, setClassFilter] = useState<string>('all');

  const filteredRecords = useMemo(() => {
    if (classFilter === 'all') return initialData.records;
    return initialData.records.filter((r) => r.classId === classFilter);
  }, [initialData.records, classFilter]);

  const rateColor = (rate: number | null) => {
    if (rate === null) return 'text-slate-400';
    if (rate >= 90) return 'text-emerald-600';
    if (rate >= 75) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-400">Academics</p>
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500">Track your attendance across all enrolled classes.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <p className="text-sm font-medium text-slate-500">Overall Attendance</p>
          </div>
          <p className={`mt-3 text-3xl font-bold ${rateColor(initialData.overallAttendanceRate)}`}>
            {initialData.overallAttendanceRate !== null ? `${initialData.overallAttendanceRate}%` : '—'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs">
          <div className="flex items-center gap-3">
            <CalendarCheck className="w-5 h-5 text-emerald-500" />
            <p className="text-sm font-medium text-slate-500">Days Present</p>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{initialData.totalPresent}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs">
          <div className="flex items-center gap-3">
            <CalendarX className="w-5 h-5 text-red-500" />
            <p className="text-sm font-medium text-slate-500">Days Absent</p>
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{initialData.totalAbsent}</p>
        </div>
      </div>

      {initialData.byClass.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">By Class</h2>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
            >
              <option value="all">All Classes</option>
              {initialData.byClass.map((c) => (
                <option key={c.classId} value={c.classId}>{c.className}</option>
              ))}
            </select>
          </div>
          <div className="divide-y divide-slate-50">
            {initialData.byClass.map((c) => (
              <div key={c.classId} className="p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{c.className}</p>
                  <p className="text-sm text-slate-500">{c.presentCount} present / {c.total} total</p>
                </div>
                <p className={`text-xl font-bold ${rateColor(c.attendanceRate)}`}>
                  {c.attendanceRate !== null ? `${c.attendanceRate}%` : '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h2 className="font-semibold text-slate-900">Recent Records</h2>
        </div>
        {filteredRecords.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No attendance records found.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredRecords.slice(0, 30).map((r) => (
              <div key={r.id} className="p-4 px-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{r.className}</p>
                  <p className="text-xs text-slate-500">{new Date(r.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    r.status === 'present'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {r.status === 'present' ? 'Present' : 'Absent'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
