'use client';

import React, { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import { 
  Users, 
  GraduationCap, 
  Calendar, 
  Terminal, 
  Megaphone, 
  TrendingUp, 
  Settings, 
  Copy, 
  Check, 
  RefreshCw, 
  Edit3, 
  User, 
  ShieldAlert,
  Building2,
  Trophy,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  mode: string | null;
  workspaceId: string | null;
  workspaceName: string;
  createdAt: string;
  workspaces?: { id: string; name: string; role: string }[];
}

interface WorkspaceStats {
  totalStudents: number;
  totalTutors: number;
  avgWorkspaceAttendance: number;
}

export default function ProfilePage() {
  const { loadProfile: reloadGlobalProfile } = useUser();
  const { showError, showMessage } = useToast();

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  
  // Workspace stats
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  };

  const fetchProfileDetails = async () => {
    try {
      setLoading(true);
      const token = getCookie('session_token');
      if (!token) return;
      
      const res = await fetch('/api/school/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();

      if (body.success && body.data) {
        setProfile(body.data);
        setEditName(body.data.name);
        
        // Fetch workspace stats if the role is Principal or Tutor
        const roleLower = body.data.role.toLowerCase();
        if (roleLower === 'principal' || roleLower === 'tutor' || roleLower === 'teacher') {
          fetchWorkspaceStats();
        }
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaceStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch('/api/reports');
      const body = await res.json();
      if (body.success && body.data) {
        if (body.data.isSummary) {
          setStats({
            totalStudents: body.data.stats.totalStudents,
            totalTutors: body.data.stats.totalTutors,
            avgWorkspaceAttendance: body.data.stats.avgWorkspaceAttendance
          });
        }
      }
    } catch (e) {
      console.error('Failed to load workspace reports stats', e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = editName.trim();
    if (!name) return;

    try {
      setSaving(true);
      const res = await fetch('/api/school/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const body = await res.json();

      if (res.ok && body.success) {
        showMessage('Profile name updated successfully', 'success');
        setProfile(prev => prev ? { ...prev, name } : null);
        await reloadGlobalProfile().catch(() => null);
      } else {
        throw new Error(body.error?.message || 'Failed to update profile');
      }
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const copyWorkspaceId = () => {
    if (!profile?.workspaceId) return;
    navigator.clipboard.writeText(profile.workspaceId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    showMessage('Workspace ID copied to clipboard', 'info');
  };

  const isPrincipal = profile?.role.toLowerCase() === 'principal';
  const isTutor = profile?.role.toLowerCase() === 'tutor' || profile?.role.toLowerCase() === 'teacher';

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar />

      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* HEADER */}
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Account Profile</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isPrincipal 
                ? 'Manage your principal credentials and institutional shortcuts' 
                : 'Manage your profile settings and workspace associations'}
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 animate-pulse select-none">
              <div className="h-20 bg-slate-100 rounded-2xl w-full"></div>
              <div className="h-32 bg-slate-100 rounded-2xl w-full"></div>
              <div className="h-44 bg-slate-100 rounded-2xl w-full"></div>
            </div>
          ) : !profile ? (
            <div className="bg-white border rounded-3xl p-12 text-center text-slate-400">
              <ShieldAlert className="w-8 h-8 mx-auto text-rose-500 mb-2" />
              <p className="text-sm font-semibold">Unable to verify user session. Please sign in again.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* PROFILE GRADIENT HERO BANNER */}
              <div className="bg-gradient-to-r from-teal-950 to-emerald-950 text-white rounded-3xl p-6 shadow-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center font-black text-emerald-400 text-xl border border-white/10 shrink-0 select-none">
                    {profile.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight leading-snug">{profile.name}</h2>
                    <p className="text-xs text-emerald-300/80">{profile.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2 select-none">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                        🛡️ {profile.role}
                      </span>
                      {profile.workspaceName && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white/90 border border-white/5">
                          🏫 {profile.workspaceName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Workspace stats summary for educators */}
                {(isPrincipal || isTutor) && stats && (
                  <div className="flex gap-4 md:gap-8 self-start md:self-auto border-t md:border-t-0 border-white/10 pt-4 md:pt-0 w-full md:w-auto justify-around md:justify-start">
                    <div className="text-center">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-300/60 block">Students</span>
                      <span className="text-xl font-extrabold block mt-0.5">{stats.totalStudents}</span>
                    </div>
                    <div className="w-px bg-white/10 h-8 self-center" />
                    <div className="text-center">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-300/60 block">Tutors</span>
                      <span className="text-xl font-extrabold block mt-0.5">{stats.totalTutors}</span>
                    </div>
                    <div className="w-px bg-white/10 h-8 self-center" />
                    <div className="text-center">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-300/60 block">Attendance Rate</span>
                      <span className="text-xl font-extrabold text-emerald-400 block mt-0.5">{stats.avgWorkspaceAttendance}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* PRINCIPAL PORTAL QUICK ACTION LINKS */}
              {isPrincipal && (
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Principal Workspace Control Shortcuts</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Quick access shortcuts to school management modules</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link href="/principal/teachers" className="border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 bg-slate-50/20 hover:bg-emerald-50/10 transition group flex flex-col justify-between h-28">
                      <div className="flex items-center justify-between">
                        <GraduationCap className="w-5 h-5 text-indigo-700 group-hover:scale-105 transition-transform" />
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs leading-none">Teachers Registry</h4>
                        <p className="text-[10px] text-slate-450 mt-1 line-clamp-1">Manage staff and workspace faculty members</p>
                      </div>
                    </Link>

                    <Link href="/principal/join-requests" className="border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 bg-slate-50/20 hover:bg-emerald-50/10 transition group flex flex-col justify-between h-28">
                      <div className="flex items-center justify-between">
                        <Users className="w-5 h-5 text-emerald-700 group-hover:scale-105 transition-transform" />
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs leading-none">Admissions Board</h4>
                        <p className="text-[10px] text-slate-450 mt-1 line-clamp-1">Approve pending student join requests</p>
                      </div>
                    </Link>

                    <Link href="/reports" className="border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 bg-slate-50/20 hover:bg-emerald-50/10 transition group flex flex-col justify-between h-28">
                      <div className="flex items-center justify-between">
                        <TrendingUp className="w-5 h-5 text-emerald-700 group-hover:scale-105 transition-transform" />
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs leading-none">Workspace Reports</h4>
                        <p className="text-[10px] text-slate-450 mt-1 line-clamp-1">Analyze class records and check-ins ledger</p>
                      </div>
                    </Link>

                    <Link href="/principal/announcements" className="border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 bg-slate-50/20 hover:bg-emerald-50/10 transition group flex flex-col justify-between h-28">
                      <div className="flex items-center justify-between">
                        <Megaphone className="w-5 h-5 text-teal-650 group-hover:scale-105 transition-transform" />
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs leading-none">Bulletin Announcements</h4>
                        <p className="text-[10px] text-slate-450 mt-1 line-clamp-1">Publish workspace bulletin updates</p>
                      </div>
                    </Link>

                    <Link href="/logs" className="border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 bg-slate-50/20 hover:bg-emerald-50/10 transition group flex flex-col justify-between h-28">
                      <div className="flex items-center justify-between">
                        <Terminal className="w-5 h-5 text-teal-700 group-hover:scale-105 transition-transform" />
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs leading-none">Workspace Audit Activity</h4>
                        <p className="text-[10px] text-slate-450 mt-1 line-clamp-1">Monitor tenant log activity records</p>
                      </div>
                    </Link>

                    <Link href="/principal/settings" className="border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 bg-slate-50/20 hover:bg-emerald-50/10 transition group flex flex-col justify-between h-28">
                      <div className="flex items-center justify-between">
                        <Settings className="w-5 h-5 text-slate-500 group-hover:scale-105 transition-transform" />
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs leading-none">Workspace Settings</h4>
                        <p className="text-[10px] text-slate-450 mt-1 line-clamp-1">Configure active tenant metadata settings</p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ACCOUNT PROFILE EDIT CARD */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Account Settings</h3>
                  
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                        Full Display Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        disabled
                        value={profile.email}
                        className="w-full px-4 py-2 border border-slate-150 rounded-xl bg-slate-100 text-xs font-semibold text-slate-500 cursor-not-allowed outline-none"
                        title="Email matches your identity log and cannot be modified."
                      />
                      <span className="text-[9px] text-slate-400 font-semibold mt-1 block">
                        Email matches your authentication session token.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={saving || !editName.trim() || editName.trim() === profile.name}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-705 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-3.5 h-3.5" />
                          Update Display Name
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* TENANT WORKSPACE METADATA DETAILS */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Tenant Workspace Details</h3>
                  
                  <div className="space-y-4 text-xs font-medium">
                    <div>
                      <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                        Workspace Name
                      </span>
                      <span className="text-slate-800 font-bold block mt-0.5">
                        {profile.workspaceName || 'Not Assigned'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                        Workspace Tenant ID
                      </span>
                      {profile.workspaceId ? (
                        <div className="flex items-center gap-2 mt-1">
                          <code className="px-2.5 py-1 bg-slate-50 border border-slate-150 rounded-lg text-[10px] font-mono text-slate-600 select-all truncate max-w-[200px]">
                            {profile.workspaceId}
                          </code>
                          <button
                            type="button"
                            onClick={copyWorkspaceId}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm text-slate-650"
                            title="Copy Workspace Tenant ID"
                          >
                            {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic block mt-0.5">No workspace linked</span>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-[10px] text-slate-450 leading-relaxed">
                      ℹ️ **System Security Information**: Access tokens are stored locally. Roles and workspace mappings are managed globally by platform admins. If you require access updates or workspace linkages, please contact your Organization Administrator.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
