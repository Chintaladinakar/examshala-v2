'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { fetchJson } from '@/lib/api';

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
  icon: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCookie(name: string): string {
  if (typeof document === 'undefined') return '';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
}

function buildLinks(role: string, mode: string): NavLink[] {
  const isPrincipal = role === 'principal';
  const inPrincipalMode = isPrincipal && mode === 'principal';

  if (isPrincipal && inPrincipalMode) {
    return [
      { href: '/dashboard',   label: 'Dashboard',   icon: '📊' },
      { href: '/students',    label: 'Students',     icon: '🎓' },
      { href: '/teachers',    label: 'Teachers',     icon: '👨‍🏫' },
      { href: '/classes',     label: 'Classes',      icon: '🏫' },
      { href: '/attendance',  label: 'Attendance',   icon: '📅' },
      { href: '/assignments', label: 'Assignments',  icon: '📝' },
      { href: '/admin/logs',  label: 'Logs',         icon: '🗂️' },
      { href: '/profile',     label: 'Profile',      icon: '👤' },
    ];
  }

  if (isPrincipal && !inPrincipalMode) {
    // Principal in Teacher Mode
    return [
      { href: '/dashboard',   label: 'Dashboard',   icon: '📊' },
      { href: '/students',    label: 'Students',     icon: '🎓' },
      { href: '/classes',     label: 'Classes',      icon: '🏫' },
      { href: '/attendance',  label: 'Attendance',   icon: '📅' },
      { href: '/assignments', label: 'Assignments',  icon: '📝' },
      { href: '/profile',     label: 'Profile',      icon: '👤' },
    ];
  }

  // Regular teacher / tutor
  return [
    { href: '/dashboard',   label: 'Dashboard',   icon: '📊' },
    { href: '/students',    label: 'Students',     icon: '🎓' },
    { href: '/classes',     label: 'Classes',      icon: '🏫' },
    { href: '/attendance',  label: 'Attendance',   icon: '📅' },
    { href: '/assignments', label: 'Assignments',  icon: '📝' },
    { href: '/profile',     label: 'Profile',      icon: '👤' },
  ];
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SidebarSkeleton() {
  return (
    <aside
      style={{ backgroundColor: '#0f2b2b' }}
      className="w-64 min-h-screen flex flex-col border-r border-teal-900/60 shrink-0 select-none animate-pulse"
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

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Profile ──────────────────────────────────────────────────────────────

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = getCookie('session_token');
      if (!token) {
        router.push('/signin');
        return;
      }
      const response = await fetchJson<{ success: boolean; data: UserProfile }>(
        '/api/school/profile',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.success && response.data) {
        setProfile(response.data);
      }
    } catch (err) {
      console.error('Failed to load school user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // ── Close dropdown on outside click ──────────────────────────────────────

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // ── Mode switch ───────────────────────────────────────────────────────────

  const handleModeSwitch = async () => {
    if (!profile || profile.role.toLowerCase() !== 'principal') return;
    setDropdownOpen(false);
    try {
      setSwitching(true);
      const token = getCookie('session_token');
      const response = await fetchJson<{ success: boolean; data: unknown }>(
        '/api/school/switch-mode',
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.success) {
        await loadProfile();
        router.refresh();
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
      className="w-64 min-h-screen flex flex-col border-r border-teal-900/60 shrink-0 select-none"
    >
      {/* ── Header ── */}
      <div className="px-5 pt-6 pb-5 border-b border-teal-900/60 space-y-3">
        {/* Logo + brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-white text-teal-950 font-black rounded-lg flex items-center justify-center text-base shadow-md group-hover:scale-105 transition-transform duration-200">
            E
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white leading-none">
            Examshala
          </span>
        </Link>

        {/* Workspace name */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-teal-400/80 font-semibold tracking-widest uppercase leading-none">
            🏫
          </span>
          <span className="text-[11px] text-teal-300/80 font-semibold truncate leading-none">
            {profile?.workspaceName || 'Loading workspace…'}
          </span>
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
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const isActive =
            link.href === '/dashboard'
              ? pathname === link.href
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-[13px] transition-all duration-150 group relative ${
                isActive
                  ? 'bg-teal-800/60 text-white shadow-inner border-l-[3px] border-teal-400 pl-[13px]'
                  : 'text-teal-100/70 hover:bg-teal-800/30 hover:text-white border-l-[3px] border-transparent pl-[13px]'
              }`}
            >
              <span className="text-base leading-none">{link.icon}</span>
              <span className="leading-none">{link.label}</span>

              {/* Active indicator dot */}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User section (bottom) ── */}
      <div className="p-3 border-t border-teal-900/60 relative" ref={dropdownRef}>
        {/* Dropdown panel */}
        {dropdownOpen && (
          <div
            className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl border border-teal-800/70 shadow-2xl overflow-hidden z-50"
            style={{ backgroundColor: '#0d2424' }}
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-teal-800/50 bg-teal-900/20">
              <p className="text-xs font-bold text-teal-100 truncate">
                {profile?.name || 'User'}
              </p>
              <p className="text-[10px] text-teal-400 truncate mt-0.5">
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
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-semibold text-teal-100/80 hover:bg-teal-800/40 hover:text-white transition-all duration-150"
              >
                <span>👤</span>
                <span>View Profile</span>
              </Link>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-150 cursor-pointer"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Avatar trigger button */}
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer group ${
            dropdownOpen
              ? 'bg-teal-800/50 ring-1 ring-teal-700/60'
              : 'hover:bg-teal-800/30'
          }`}
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 border border-teal-600/60 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-inner">
            {initials}
          </div>

          {/* Name + email */}
          <div className="min-w-0 flex-1 text-left">
            <div className="text-[12px] font-bold text-teal-100 truncate leading-snug">
              {profile?.name || 'User'}
            </div>
            <div className="text-[10px] text-teal-400 truncate leading-snug">
              {profile?.email}
            </div>
          </div>

          {/* Chevron */}
          <svg
            className={`w-3.5 h-3.5 text-teal-500 shrink-0 transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Always-visible Sign Out button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-[12px] font-bold text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-all duration-150 cursor-pointer group border border-transparent hover:border-rose-500/20"
        >
          <span className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-sm shrink-0 group-hover:bg-rose-500/20 transition-all">
            🚪
          </span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
