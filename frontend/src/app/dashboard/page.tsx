'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardSidebar from '@/components/DashboardSidebar';
import { fetchJson } from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  mode: string | null;
  workspaceId: string | null;
  workspaceName: string;
}

interface ActivityLog {
  id: string;
  actionType: string;
  timestamp: string;
  User: {
    name: string;
    role: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const firstName = name.split(' ')[0] || name;
  return `Good ${part}, ${firstName}!`;
}

function relativeTime(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function actionBadge(actionType: string): { label: string; cls: string } {
  switch (actionType) {
    case 'attendance_marked':
      return { label: 'Attendance Marked', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'attendance_updated':
      return { label: 'Attendance Edited', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'assignment_created':
      return { label: 'Assignment Created', cls: 'bg-sky-50 text-sky-700 border-sky-200' };
    case 'feedback_added':
      return { label: 'Feedback Added', cls: 'bg-violet-50 text-violet-700 border-violet-200' };
    case 'class_created':
      return { label: 'Class Created', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    default:
      return { label: actionType.replace(/_/g, ' '), cls: 'bg-slate-50 text-slate-600 border-slate-200' };
  }
}

function roleBadgeCls(role: string): string {
  switch (role.toLowerCase()) {
    case 'principal': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'teacher': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

/* ------------------------------------------------------------------ */
/*  Skeleton components                                                 */
/* ------------------------------------------------------------------ */

function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 bg-slate-100 rounded-full" />
        <div className="h-7 w-12 bg-slate-100 rounded-full" />
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
          <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-slate-100 rounded-full" />
            <div className="h-5 w-24 bg-slate-100 rounded-full" />
          </div>
          <div className="h-3 w-14 bg-slate-100 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [classCount, setClassCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [attendancePct, setAttendancePct] = useState<number | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const token = getCookie('session_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, classesRes, teachersRes, assignmentsRes, logsRes] = await Promise.all([
        fetchJson<{ success: boolean; data: UserProfile }>('/api/school/profile', { headers }).catch(() => null),
        fetchJson<{ success: boolean; data: any[] }>('/api/school/classes', { headers }).catch(() => null),
        fetchJson<{ success: boolean; data: any[] }>('/api/school/teachers', { headers }).catch(() => null),
        fetchJson<{ success: boolean; data: any[] }>('/api/school/assignments', { headers }).catch(() => null),
        fetchJson<{ success: boolean; data: ActivityLog[] }>('/api/school/logs', { headers }).catch(() => null),
      ]);

      if (profileRes?.success && profileRes.data) {
        setProfile(profileRes.data);
      }

      const classes = classesRes?.data || [];
      setClassCount(classes.length);

      let totalStudents = 0;
      let totalPresent = 0;
      let totalAttendanceRecords = 0;
      classes.forEach((c: any) => {
        totalStudents += c.students?.length || 0;
        if (Array.isArray(c.attendance)) {
          c.attendance.forEach((a: any) => {
            totalAttendanceRecords++;
            if (a.status === 'present' || a.status === 'Present') totalPresent++;
          });
        }
      });
      setStudentCount(totalStudents);

      if (totalAttendanceRecords > 0) {
        setAttendancePct(Math.round((totalPresent / totalAttendanceRecords) * 100));
      } else {
        setAttendancePct(null);
      }

      setTeacherCount(teachersRes?.data?.length || 0);
      setAssignmentCount(assignmentsRes?.data?.length || 0);
      setActivities(logsRes?.data || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const role = profile?.role?.toLowerCase() || '';
  const mode = profile?.mode?.toLowerCase() || 'principal';
  const isPrincipal = role === 'principal';
  const isTeacherMode = isPrincipal ? mode === 'teacher' : true;

  /* ---------------------------------------------------------------- */
  /*  Stat cards config                                                 */
  /* ---------------------------------------------------------------- */
  const statCards = [
    {
      id: 'classes',
      label: 'Total Classes',
      value: classCount,
      icon: '🏫',
      iconBg: 'bg-emerald-50 border-emerald-100',
      accent: 'text-emerald-600',
      highlight: 'from-emerald-500/10 to-transparent',
      show: true,
    },
    {
      id: 'students',
      label: 'Total Students',
      value: studentCount,
      icon: '🎓',
      iconBg: 'bg-sky-50 border-sky-100',
      accent: 'text-sky-600',
      highlight: 'from-sky-500/10 to-transparent',
      show: true,
    },
    {
      id: 'teachers',
      label: 'Total Teachers',
      value: teacherCount,
      icon: '👨‍🏫',
      iconBg: 'bg-amber-50 border-amber-100',
      accent: 'text-amber-600',
      highlight: 'from-amber-500/10 to-transparent',
      show: !isTeacherMode,
    },
    {
      id: 'attendance',
      label: "Today's Attendance",
      value: attendancePct !== null ? `${attendancePct}%` : '—',
      icon: '📅',
      iconBg: 'bg-teal-50 border-teal-100',
      accent: 'text-teal-600',
      highlight: 'from-teal-500/10 to-transparent',
      show: true,
    },
    {
      id: 'assignments',
      label: 'Pending Assignments',
      value: assignmentCount,
      icon: '📝',
      iconBg: 'bg-violet-50 border-violet-100',
      accent: 'text-violet-600',
      highlight: 'from-violet-500/10 to-transparent',
      show: true,
    },
  ].filter(c => c.show);

  /* ---------------------------------------------------------------- */
  /*  Quick actions config                                              */
  /* ---------------------------------------------------------------- */
  const quickActions = [
    {
      id: 'mark-attendance',
      label: 'Mark Attendance',
      icon: '➕',
      sub: 'Record today\'s attendance',
      href: '/attendance',
      cls: 'hover:border-emerald-300 hover:bg-emerald-50/40',
      iconCls: 'bg-emerald-100 text-emerald-700',
      show: true,
    },
    {
      id: 'create-assignment',
      label: 'Create Assignment',
      icon: '📝',
      sub: 'Add a new class assignment',
      href: '/assignments',
      cls: 'hover:border-sky-300 hover:bg-sky-50/40',
      iconCls: 'bg-sky-100 text-sky-700',
      show: isTeacherMode,
    },
    {
      id: 'manage-students',
      label: 'Manage Students',
      icon: '👥',
      sub: 'View and edit students',
      href: '/students',
      cls: 'hover:border-violet-300 hover:bg-violet-50/40',
      iconCls: 'bg-violet-100 text-violet-700',
      show: true,
    },
    {
      id: 'manage-teachers',
      label: 'Manage Teachers',
      icon: '👨‍🏫',
      sub: 'Staff overview and controls',
      href: '/teachers',
      cls: 'hover:border-amber-300 hover:bg-amber-50/40',
      iconCls: 'bg-amber-100 text-amber-700',
      show: !isTeacherMode,
    },
  ].filter(a => a.show);

  /* ---------------------------------------------------------------- */
  /*  Render                                                            */
  /* ---------------------------------------------------------------- */
  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 md:px-10 md:py-10 space-y-8">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-8 w-64 bg-slate-200 rounded-xl" />
                  <div className="h-4 w-44 bg-slate-100 rounded-lg" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {profile ? getGreeting(profile.name) : 'Welcome back!'}
                    </h1>
                    {/* Mode badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                        isTeacherMode
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      <span>{isTeacherMode ? '🟢' : '🟣'}</span>
                      {isTeacherMode ? 'Teacher Mode' : 'Principal Mode'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm font-medium">
                    🏫&nbsp;{profile?.workspaceName || 'Your School'}
                    &nbsp;&nbsp;·&nbsp;&nbsp;Here's what's happening today.
                  </p>
                </>
              )}
            </div>
            {/* Refresh button */}
            {!loading && (
              <button
                onClick={loadData}
                className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold shadow-sm hover:bg-slate-50 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                🔄 Refresh
              </button>
            )}
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {loading
              ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />)
              : statCards.map(card => (
                  <div
                    key={card.id}
                    className="group relative bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                  >
                    {/* Subtle gradient accent */}
                    <div
                      className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r ${card.highlight} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    />
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-13 h-13 w-12 h-12 rounded-2xl border flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform duration-300 ${card.iconBg}`}
                      >
                        {card.icon}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider leading-none mb-1.5">
                          {card.label}
                        </p>
                        <p className={`text-2xl font-black ${card.accent} leading-none`}>
                          {card.value}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
          </div>

          {/* ── Quick Actions ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-800">⚡ Quick Actions</h2>
              <span className="text-xs text-slate-400 font-medium">Jump to common tasks</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {quickActions.map(action => (
                <Link
                  key={action.id}
                  id={`quick-action-${action.id}`}
                  href={action.href}
                  className={`group flex-shrink-0 flex items-center gap-3.5 px-5 py-4 rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${action.cls}`}
                >
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform duration-200 ${action.iconCls}`}
                  >
                    {action.icon}
                  </span>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-bold text-slate-800 whitespace-nowrap">{action.label}</p>
                    <p className="text-xs text-slate-400 whitespace-nowrap">{action.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Bottom Layout: Activity Log + Info ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Activity Log — takes 2/3 width */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-800">📋 Activity Log</h2>
                <span className="text-xs text-slate-400 font-medium">Live workspace feed</span>
              </div>

              {loading ? (
                <ActivitySkeleton />
              ) : activities.length === 0 ? (
                <div className="py-14 text-center flex flex-col items-center gap-3 text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <span className="text-4xl">📋</span>
                  <p className="text-sm font-semibold">No activity recorded yet</p>
                  <p className="text-xs">Actions like marking attendance or creating assignments will appear here.</p>
                </div>
              ) : (
                <div className="space-y-0 max-h-[420px] overflow-y-auto divide-y divide-slate-100 -mx-1 px-1">
                  {activities.slice(0, 15).map((act) => {
                    const badge = actionBadge(act.actionType);
                    const roleCls = roleBadgeCls(act.User.role);
                    return (
                      <div
                        key={act.id}
                        className="flex items-start gap-3.5 py-3.5 hover:bg-slate-50/70 transition-colors rounded-lg px-2 -mx-2"
                      >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-black text-slate-600 shrink-0 mt-0.5">
                          {act.User.name.substring(0, 2).toUpperCase()}
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800 leading-tight">
                              {act.User.name}
                            </span>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${roleCls}`}
                            >
                              {act.User.role}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        {/* Timestamp */}
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 mt-1 whitespace-nowrap">
                          {relativeTime(act.timestamp)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right info panel */}
            <div className="space-y-4">
              {/* Platform summary card */}
              <div className="bg-gradient-to-br from-teal-900 via-teal-950 to-slate-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                {/* Decorative ring */}
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-teal-700/20 border border-teal-700/30" />
                <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-teal-800/15 border border-teal-700/20" />
                <div className="relative z-10 space-y-4">
                  <div className="w-11 h-11 rounded-2xl bg-teal-800/60 border border-teal-700/50 flex items-center justify-center text-2xl shadow-inner">
                    🏫
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg tracking-tight">Examshala SaaS</h3>
                    <p className="text-teal-300/80 text-xs mt-1 leading-relaxed">
                      Your all-in-one school management platform. Switch between Principal and Teacher modes, track attendance, and manage your workspace seamlessly.
                    </p>
                  </div>
                  {profile && (
                    <div className="pt-2 border-t border-teal-800/60 space-y-1">
                      <p className="text-teal-200 text-xs font-semibold truncate">👤 {profile.name}</p>
                      <p className="text-teal-400 text-[11px] truncate">{profile.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick stats summary */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-700">📊 At a Glance</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Classes', value: classCount, color: 'text-emerald-600' },
                    { label: 'Students', value: studentCount, color: 'text-sky-600' },
                    { label: 'Assignments', value: assignmentCount, color: 'text-violet-600' },
                    {
                      label: 'Attendance',
                      value: attendancePct !== null ? `${attendancePct}%` : '—',
                      color: 'text-teal-600',
                    },
                  ].map(item => (
                    <div
                      key={item.label}
                      className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100"
                    >
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{item.label}</p>
                      {loading ? (
                        <div className="h-5 w-8 bg-slate-200 rounded animate-pulse mt-0.5" />
                      ) : (
                        <p className={`text-lg font-black ${item.color}`}>{item.value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation shortcuts */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-2">
                <h3 className="text-sm font-bold text-slate-700 mb-3">🔗 Navigate</h3>
                {[
                  { href: '/classes', icon: '🏫', label: 'Classes' },
                  { href: '/attendance', icon: '📅', label: 'Attendance' },
                  { href: '/assignments', icon: '📝', label: 'Assignments' },
                  { href: '/profile', icon: '👤', label: 'My Profile' },
                ].map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all duration-200 group"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform duration-200">
                      {link.icon}
                    </span>
                    {link.label}
                    <span className="ml-auto text-slate-300 group-hover:text-slate-500 transition-colors text-xs">›</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
