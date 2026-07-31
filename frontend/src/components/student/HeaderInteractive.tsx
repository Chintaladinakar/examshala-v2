"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Menu, User, Settings, LogOut, ChevronDown, Sparkles, Building2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string | null;
  createdAt: string;
}

interface HeaderInteractiveProps {
  studentName: string;
  unreadCount: number;
  notifications?: NotificationItem[];
  activeWorkspaceId?: string;
  workspaceName?: string;
  workspaces?: Array<{ id: string; name: string }>;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function HeaderInteractive({
  studentName,
  unreadCount,
  notifications = [],
  activeWorkspaceId,
  workspaceName,
  workspaces = []
}: HeaderInteractiveProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
        setWorkspaceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const triggerMobileDrawer = () => {
    // Dispatch custom event to let the Sidebar component know to slide in
    const event = new CustomEvent('toggle-student-drawer');
    window.dispatchEvent(event);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' });
    try {
      localStorage.removeItem('token');
    } catch {
      // ignore
    }
    router.push('/signin');
    router.refresh();
  };

  const recentNotifications = notifications.slice(0, 6);

  const handleWorkspaceChange = (id: string) => {
    document.cookie = `workspace_id=${id}; path=/; max-age=31536000; SameSite=Lax`;
    setWorkspaceOpen(false);
    router.refresh();
  };

  return (
    <div className="flex items-center justify-between w-full gap-4">
      <div className="flex items-center gap-3">
        {/* 1. Hamburger button on mobile / tablet */}
        <button 
          type="button"
          onClick={triggerMobileDrawer}
          className="md:hidden flex items-center justify-center p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors animate-in fade-in"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Workspace switching dropdown */}
        {workspaces.length > 0 && (
          <div className="relative" ref={workspaceRef}>
            <button
              type="button"
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 h-10 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 active:bg-slate-100 transition-all cursor-pointer shadow-3xs hover:shadow-2xs text-left"
              aria-haspopup="true"
              aria-expanded={workspaceOpen}
            >
              <div className="w-6.5 h-6.5 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                <Building2 className="w-3.5 h-3.5 stroke-[2.2px]" />
              </div>
              <span className="text-xs font-extrabold tracking-wider text-slate-800 uppercase max-w-[120px] sm:max-w-[200px] truncate">
                {workspaceName || 'STUDENT PORTAL'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${workspaceOpen ? 'rotate-180' : ''}`} />
            </button>

            {workspaceOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-slate-200/85 rounded-2xl shadow-xl z-50 p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3 py-2 flex flex-col border-b border-slate-100 mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Select Workspace</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {workspaces.map((w) => {
                    const isActive = w.id === activeWorkspaceId;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => handleWorkspaceChange(w.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors ${
                          isActive
                            ? 'bg-teal-50 text-teal-900 font-extrabold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Building2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                          <span className="truncate">{w.name}</span>
                        </div>
                        {isActive && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Lightweight Search Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (searchQuery.trim()) {
            router.push(`/studentdashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
          }
        }}
        className="relative hidden sm:block w-48 md:w-64"
      >
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-slate-400" />
        </span>
        <input
          type="text"
          placeholder="Search courses, exams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-4 text-xs focus:bg-white focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-slate-700"
        />
      </form>

      <div className="flex items-center gap-2">
        {/* 3. Notification Bell */}
        <div className="relative" ref={notificationsRef}>
          <button 
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors relative"
            aria-label="View notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 p-1 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Notifications</span>
                <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">New</span>
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {recentNotifications.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-slate-400">No notifications yet</div>
                ) : (
                  recentNotifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.isRead ? 'bg-slate-300' : 'bg-teal-500'}`} />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{n.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                        <span className="text-[9px] text-slate-400 mt-1 block">{timeAgo(n.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 text-center">
                <button 
                  onClick={() => {
                    setNotificationsOpen(false);
                    router.push('/studentdashboard');
                  }}
                  className="w-full text-[10px] text-teal-700 hover:text-teal-900 font-bold hover:underline transition-colors py-1"
                >
                  View all alerts
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-1.5 p-1 rounded-xl border border-slate-200/60 hover:bg-slate-50 transition-all cursor-pointer shadow-3xs"
          >
            <div className="w-7.5 h-7.5 rounded-lg bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-xs font-bold text-slate-700 pl-0.5 pr-1">{studentName.split(' ')[0]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3.5 py-2.5 flex flex-col border-b border-slate-100 mb-1">
                <span className="text-xs font-black text-slate-800 truncate">{studentName}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-500" /> Student Account
                </span>
              </div>

              <div className="space-y-0.5">
                <button 
                  onClick={() => {
                    setProfileOpen(false);
                    router.push('/studentdashboard/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  View Profile
                </button>
                <button 
                  onClick={() => {
                    setProfileOpen(false);
                    router.push('/studentdashboard/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  Settings
                </button>
                
                <div className="border-t border-slate-100 my-1.5" />

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50/50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
