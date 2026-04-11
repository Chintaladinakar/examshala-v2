"use client";

import React, { useState } from 'react';
import { ChevronDown, Building, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState("Lincoln High School");

  const workspaces = ["Lincoln High School", "A-Level Math Bootcamp", "State Board Prep"];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center px-4 md:px-8 justify-between">
      {/* Mobile Branding (only shows on mobile, since sidebar is hidden) */}
      <div className="md:hidden flex items-center gap-2">
        <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xl leading-none">E</span>
        </div>
      </div>

      <div className="flex-1 flex justify-center md:justify-start">
        {/* Workspace Switcher */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
          >
            <Building className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-800">{selectedWorkspace}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-50 overflow-hidden text-sm">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                Your Workspaces
              </div>
              {workspaces.map(ws => (
                <button
                  key={ws}
                  onClick={() => {
                    setSelectedWorkspace(ws);
                    setDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium",
                    selectedWorkspace === ws && "bg-teal-50 text-teal-800 hover:bg-teal-50"
                  )}
                >
                  {ws}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => {
            document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            localStorage.removeItem('token');
            router.push('/signin');
          }}
          className="text-sm font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
