'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { fetchJson } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Building2, 
  Calendar, 
  FileText, 
  ClipboardList, 
  Trophy, 
  BookOpen, 
  TrendingUp, 
  Terminal, 
  Megaphone, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Sparkles
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  mode: string | null;
  workspaceId: string | null;
  workspaceName: string;
}

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  title: string;
  links: NavLink[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
}

function buildLinks(role: string, mode: string): NavGroup[] {
  const isPrincipal = role === 'principal';
  const inPrincipalMode = isPrincipal && mode === 'principal';

  // Dashboard href depends on current mode for principals
  const dashboardHref = isPrincipal
    ? (inPrincipalMode ? '/principledashboard' : '/tutordashboard')
    : '/tutordashboard';

  const groups: NavGroup[] = [];

  // 1. Dashboard Group (no header title)
  groups.push({
    title: '',
    links: [
      { href: dashboardHref, label: 'Dashboard', icon: LayoutDashboard }
    ]
  });

  // 2. Academic
  const academicLinks: NavLink[] = [];
  if (inPrincipalMode) {
    academicLinks.push(
      { href: '/students', label: 'Students', icon: Users },
      { href: '/principal/teachers', label: 'Teachers', icon: GraduationCap },
      { href: '/principal/join-requests', label: 'Admission Requests', icon: Users }
    );
  } else {
    academicLinks.push({ href: '/students', label: 'Students', icon: Users });
  }
  academicLinks.push(
    { href: '/classes', label: 'Classes', icon: Building2 },
    { href: '/attendance', label: 'Attendance', icon: Calendar }
  );
  groups.push({
    title: 'Academic',
    links: academicLinks
  });

  // 3. Assessments
  const assessmentLinks: NavLink[] = [
    { href: '/coming-soon?feature=Exams', label: 'Exams', icon: FileText },
    { href: '/coming-soon?feature=QuestionBank', label: 'Question Bank', icon: ClipboardList },
  ];
  if (inPrincipalMode) {
    assessmentLinks.push({ href: '/principal/evaluations', label: 'Evaluations Override', icon: Trophy });
  } else {
    assessmentLinks.push({ href: '/coming-soon?feature=Results', label: 'Results', icon: Trophy });
  }
  groups.push({
    title: 'Assessments',
    links: assessmentLinks
  });

  // 4. Learning
  groups.push({
    title: 'Learning',
    links: [
      { href: '/assignments', label: 'Assignments', icon: ClipboardList },
      { href: '/coming-soon?feature=StudyMaterials', label: 'Study Materials', icon: BookOpen }
    ]
  });

  // 5. Analytics
  const analyticsLinks: NavLink[] = [
    { href: '/coming-soon?feature=Reports', label: 'Reports', icon: TrendingUp }
  ];
  if (inPrincipalMode) {
    analyticsLinks.push({ href: '/logs', label: 'Logs', icon: Terminal });
  }
  groups.push({
    title: 'Analytics',
    links: analyticsLinks
  });

  // 6. Communication
  const communicationLinks: NavLink[] = [];
  if (inPrincipalMode) {
    communicationLinks.push(
      { href: '/principal/announcements', label: 'Announcements Board', icon: Megaphone }
    );
  } else {
    communicationLinks.push(
      { href: '/coming-soon?feature=Announcements', label: 'Announcements', icon: Megaphone }
    );
  }
  communicationLinks.push(
    { href: '/coming-soon?feature=Calendar', label: 'Calendar', icon: Calendar }
  );
  groups.push({
    title: 'Communication',
    links: communicationLinks
  });

  // 7. Account
  const accountLinks: NavLink[] = [
    { href: '/profile', label: 'Profile', icon: User }
  ];
  if (inPrincipalMode) {
    accountLinks.push({ href: '/principal/settings', label: 'Admin Settings', icon: Settings });
  } else {
    accountLinks.push({ href: '/coming-soon?feature=Settings', label: 'Settings', icon: Settings });
  }
  groups.push({
    title: 'Account',
    links: accountLinks
  });

  return groups;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SidebarSkeleton() {
  return (
    <aside
      style={{ backgroundColor: '#0f2b2b' }}
      className="w-64 h-screen sticky top-0 flex flex-col border-r border-teal-900/60 shrink-0 select-none animate-pulse"
    >
      <div className="p-6 border-b border-teal-900/60 space-y-3">
        <div className="h-8 bg-teal-900/60 rounded-lg w-3/4" />
        <div className="h-4 bg-teal-900/40 rounded w-1/2" />
        <div className="h-5 bg-teal-900/30 rounded-full w-28 mt-1" />
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-teal-900/40 rounded-xl" />
        ))}
      </nav>
      <div className="p-4 border-t border-teal-900/60">
        <div className="h-12 bg-teal-900/40 rounded-xl" />
      </div>
    </aside>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user: profile, loading, switchMode, switchWorkspace } = useUser();
  const [switching, setSwitching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [workspaceSwitching, setWorkspaceSwitching] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

  // ── Close dropdown on outside click ──────────────────────────────────────

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(e.target as Node)) {
        setWorkspaceDropdownOpen(false);
      }
    }
    if (dropdownOpen || workspaceDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, workspaceDropdownOpen]);

  // ── Workspace switch with redirect ────────────────────────────────────────

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    if (workspaceId === profile?.workspaceId) return;
    try {
      setWorkspaceSwitching(true);
      await switchWorkspace(workspaceId);
      window.location.reload();
    } catch (err) {
      alert('Failed to switch workspace: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setWorkspaceSwitching(false);
    }
  };

  // ── Mode switch with redirect ─────────────────────────────────────────────

  const handleModeSwitch = async () => {
    if (!profile || profile.role.toLowerCase() !== 'principal') return;
    setDropdownOpen(false);
    try {
      setSwitching(true);
      const newMode = await switchMode();
      if (newMode) {
        // Redirect to the correct dashboard for the new mode
        const targetPath = newMode === 'teacher' ? '/tutordashboard' : '/principledashboard';
        router.push(targetPath);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      alert(`Failed to switch mode: ${msg}`);
    } finally {
      setSwitching(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    document.cookie = 'session_token=; path=/; max-age=0; SameSite=Lax';
    router.push('/signin');
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return <SidebarSkeleton />;

  // ── Derived state ─────────────────────────────────────────────────────────

  const role = profile?.role.toLowerCase() || 'teacher';
  const mode = profile?.mode || 'principal';
  const isPrincipal = role === 'principal';
  const inPrincipalMode = isPrincipal && mode === 'principal';
  const links = buildLinks(role, mode);

  const initials = profile?.name
    ? profile.name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <aside
      style={{ backgroundColor: '#0f2b2b' }}
      className="w-64 h-screen sticky top-0 flex flex-col border-r border-teal-900/60 shrink-0 select-none"
    >
      {/* ── Header ── */}
      <div className="px-5 pt-6 pb-5 border-b border-teal-900/60 space-y-3">
        {/* Logo + brand */}
        <Link href="/principledashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-white text-teal-950 font-black rounded-lg flex items-center justify-center text-base shadow-md group-hover:scale-105 transition-transform duration-200">
            E
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white leading-none">
            Examshala
          </span>
        </Link>

        {/* Workspace selector dropdown trigger */}
        <div className="relative" ref={workspaceDropdownRef}>
          {profile?.workspaces && profile.workspaces.length > 1 ? (
            <button
              onClick={() => setWorkspaceDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between gap-1.5 p-2 rounded-xl bg-white/5 border border-white/5 text-left text-teal-100 hover:bg-white/10 hover:text-white transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[10px] leading-none shrink-0">🏫</span>
                <span className="text-[11px] font-bold truncate leading-none">
                  {profile.workspaceName}
                </span>
              </div>
              <ChevronDown
                className={`w-3 h-3 text-teal-400 shrink-0 transition-transform duration-200 ${
                  workspaceDropdownOpen ? 'rotate-180 text-emerald-400' : 'group-hover:text-teal-200'
                }`}
              />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 select-none">
              <span className="text-[10px] leading-none shrink-0">🏫</span>
              <span className="text-[11px] text-teal-300/80 font-bold truncate leading-none">
                {profile?.workspaceName || 'Loading workspace…'}
              </span>
            </div>
          )}

          {/* Workspace dropdown list */}
          {workspaceDropdownOpen && profile?.workspaces && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200 p-1 space-y-0.5"
              style={{ backgroundColor: '#0d2424', backdropFilter: 'blur(12px)' }}
            >
              <div className="px-2.5 py-1 text-[9px] font-extrabold text-teal-400/40 uppercase tracking-widest border-b border-white/5 mb-1">
                Your Workspaces
              </div>
              {profile.workspaces.map((ws) => {
                const isActive = ws.id === profile.workspaceId;
                return (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setWorkspaceDropdownOpen(false);
                      handleWorkspaceSwitch(ws.id);
                    }}
                    disabled={workspaceSwitching || isActive}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'text-teal-100/80 hover:bg-white/5 hover:text-white disabled:opacity-50'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-sm ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mode badge */}
        {isPrincipal ? (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              inPrincipalMode
                ? 'bg-violet-500/15 text-violet-300 border-violet-500/25'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
            }`}
          >
            <span className="text-[8px]">{inPrincipalMode ? '🟣' : '🟢'}</span>
            {inPrincipalMode ? 'Principal Mode' : 'Teacher Mode'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
            <span className="text-[8px]">🟢</span>
            {role}
          </span>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-5 space-y-4 overflow-y-auto custom-sidebar-scrollbar">
        {links.map((group, gIdx) => (
          <div key={gIdx} className="space-y-0.5">
            {group.title && (
              <div className="text-[10px] text-teal-400/40 font-extrabold uppercase tracking-widest px-3.5 pt-4 pb-1.5 select-none">
                {group.title}
              </div>
            )}
            {group.links.map((link) => {
              const isActive =
                link.href === '/principledashboard' || link.href === '/tutordashboard'
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-[12px] transition-all duration-200 group relative border-l-4 ${
                    isActive
                      ? 'bg-white/10 text-white shadow-sm border-emerald-400 pl-3.5'
                      : 'text-teal-100/60 hover:bg-white/5 hover:text-teal-50 hover:pl-4 border-transparent pl-3.5'
                  }`}
                >
                  <link.icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-emerald-400' : 'text-teal-300/50 group-hover:text-teal-200'}`} />
                  <span className="leading-none">{link.label}</span>

                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-sm" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── User section (bottom) ── */}
      <div className="p-3 border-t border-teal-900/60 relative" ref={dropdownRef}>
        {/* Dropdown panel */}
        {dropdownOpen && (
          <div
            className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{ backgroundColor: '#0d2424', backdropFilter: 'blur(12px)' }}
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-white/5 bg-white/5">
              <p className="text-xs font-bold text-teal-50 truncate">
                {profile?.name || 'User'}
              </p>
              <p className="text-[10px] text-teal-300/60 truncate mt-0.5">
                {profile?.email}
              </p>
            </div>

            <div className="p-1.5 space-y-0.5">
              {/* Switch mode — only for principals */}
              {isPrincipal && (
                <button
                  onClick={handleModeSwitch}
                  disabled={switching}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 ${
                    inPrincipalMode
                      ? 'text-emerald-300 hover:bg-emerald-500/10'
                      : 'text-violet-300 hover:bg-violet-500/10'
                  }`}
                >
                  <span>{switching ? '⏳' : '🔄'}</span>
                  <span>
                    {switching
                      ? 'Switching…'
                      : inPrincipalMode
                      ? 'Switch to Teacher Mode'
                      : 'Switch to Principal Mode'}
                  </span>
                </button>
              )}

              {/* View profile */}
              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-semibold text-teal-100/80 hover:bg-white/5 hover:text-white transition-all duration-150"
              >
                <User className="w-3.5 h-3.5 text-teal-300/60" />
                <span>View Profile</span>
              </Link>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-150 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Avatar trigger button */}
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group ${
            dropdownOpen
              ? 'bg-white/10 ring-1 ring-white/10'
              : 'hover:bg-white/5'
          }`}
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 border border-emerald-400/30 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm relative overflow-hidden">
            <span className="relative z-10">{initials}</span>
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>

          {/* Name + email */}
          <div className="min-w-0 flex-1 text-left">
            <div className="text-[12px] font-bold text-teal-50 truncate leading-snug group-hover:text-white transition-colors">
              {profile?.name || 'User'}
            </div>
            <div className="text-[10px] text-teal-300/60 truncate leading-snug group-hover:text-teal-200/80 transition-colors">
              {profile?.email}
            </div>
          </div>

          {/* Chevron */}
          <ChevronDown
            className={`w-3.5 h-3.5 text-teal-400/60 group-hover:text-teal-200 shrink-0 transition-transform duration-300 ${
              dropdownOpen ? 'rotate-180 text-emerald-400' : ''
            }`}
          />
        </button>
      </div>
    </aside>
  );
}
