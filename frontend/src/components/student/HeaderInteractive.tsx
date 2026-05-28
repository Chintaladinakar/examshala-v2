"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Menu, User, Settings, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderInteractiveProps {
  studentName: string;
  unreadCount: number;
}

export function HeaderInteractive({ studentName, unreadCount }: HeaderInteractiveProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
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

  const handleLogout = () => {
    document.cookie = 'session_token=; path=/; max-age=0; SameSite=Lax';
    try {
      localStorage.removeItem('token');
    } catch {
      // ignore
    }
    router.push('/signin');
    router.refresh();
  };

  // Mock list of quick notifications
  const mockNotifications = [
    { id: 1, title: "New Assignment", desc: "Mathematics homework was uploaded", time: "10m ago", read: false },
    { id: 2, title: "Exam Scheduled", desc: "Science final is scheduled for Friday", time: "2h ago", read: false },
    { id: 3, title: "Result Declared", desc: "You scored 92% in English Quiz", time: "1d ago", read: true },
  ].slice(0, Math.max(1, unreadCount || 2));

  return (
    <div className="flex items-center justify-between w-full md:w-auto gap-4">
      {/* 1. Hamburger button on mobile / tablet */}
      <button 
        type="button"
        onClick={triggerMobileDrawer}
        className="md:hidden flex items-center justify-center p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
        aria-label="Toggle Navigation Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* 2. Lightweight Search Input */}
      <div className="relative hidden sm:block w-48 md:w-64">
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
      </div>

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
                {mockNotifications.map((n) => (
                  <div key={n.id} className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{n.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{n.desc}</p>
                      <span className="text-[9px] text-slate-400 mt-1 block">{n.time}</span>
                    </div>
                  </div>
                ))}
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
