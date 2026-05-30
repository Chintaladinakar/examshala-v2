"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { studentPortalRoutes } from '@/lib/student/routes';
import { ChevronLeft, ChevronRight, Menu, X, LogOut, GraduationCap, LayoutDashboard, BookOpen, ClipboardList, FileText, Calendar, MessageSquare, FolderOpen, Trophy, User, Settings } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const isCollapsed = false;
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sync collapsible state with localStorage on mount
  useEffect(() => {
    // Event listener for opening/toggling the mobile drawer from the Header
    const handleToggleMobileDrawer = () => {
      setIsMobileOpen((prev) => !prev);
    };

    window.addEventListener('toggle-student-drawer', handleToggleMobileDrawer);
    return () => {
      window.removeEventListener('toggle-student-drawer', handleToggleMobileDrawer);
    };
  }, []);

  // Group routes into logical sections
  const academicRoutes = studentPortalRoutes.filter(route => 
    ['Dashboard', 'Exams', 'Assignments', 'Materials'].includes(route.label)
  );
  
  const analysisRoutes = studentPortalRoutes.filter(route => 
    ['Results', 'Schedule', 'Leaderboard'].includes(route.label)
  );

  const personalRoutes = studentPortalRoutes.filter(route => 
    ['Messages'].includes(route.label)
  );

  const routeGroups = [
    { title: "Academics", routes: academicRoutes },
    { title: "Analytics & Schedule", routes: analysisRoutes },
    { title: "Personal Portal", routes: personalRoutes },
  ].filter(group => group.routes.length > 0);

  const renderNavItems = (items: typeof studentPortalRoutes, isMobileView = false) => {
    return items.map((item) => {
      const isActive = item.href === '/studentdashboard'
        ? pathname === '/studentdashboard'
        : (pathname === item.href || pathname.startsWith(`${item.href}/`));
      const showLabel = isMobileView || !isCollapsed;
      
      return item.disabled ? (
        <div
          key={item.href}
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs text-slate-400 cursor-not-allowed opacity-50",
            !showLabel ? "justify-center" : "pl-4"
          )}
          title={`${item.label} (Coming Soon)`}
        >
          <item.icon className="w-5 h-5 shrink-0 text-slate-300" />
          {showLabel && <span>{item.label}</span>}
        </div>
      ) : (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => isMobileView && setIsMobileOpen(false)}
          className={cn(
            "group flex items-center rounded-xl font-semibold transition-all duration-200 text-sm relative",
            isActive 
              ? "bg-teal-500/8 text-teal-950 shadow-2xs font-bold border-l-4 border-teal-600" 
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent",
            showLabel ? "px-3.5 py-2.5 gap-3" : "p-3 justify-center"
          )}
          title={isCollapsed && !isMobileView ? item.label : undefined}
        >
          <item.icon className={cn(
            "w-5 h-5 shrink-0 transition-all duration-200 group-hover:scale-105", 
            isActive ? "text-teal-700 stroke-[2.5px]" : "text-slate-400 group-hover:text-slate-700"
          )} />
          {showLabel && <span className="truncate">{item.label}</span>}
          {/* Collapsed dot indicator */}
          {!showLabel && isActive && (
            <div className="absolute right-1 w-1.5 h-1.5 rounded-full bg-teal-600" />
          )}
        </Link>
      );
    });
  };

  return (
    <>
      {/* 1. Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex flex-col border-r border-slate-200/80 bg-white min-h-screen transition-all duration-300 relative shrink-0 z-30",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between mb-4">
          <Link href="/studentdashboard" className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-800 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-teal-800/10 group-hover:scale-105 transition-transform duration-300">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-teal-950 to-slate-800 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
              Examshala
            </span>
          </Link>
        </div>

        {/* Navigation Routes */}
        <nav className="flex-1 px-3 space-y-5 overflow-y-auto pb-6 scrollbar-thin">
          {routeGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && (
                <h4 className="text-[10px] font-extrabold text-slate-400 px-3.5 uppercase tracking-wider mb-2">
                  {group.title}
                </h4>
              )}
              <div className="space-y-0.5">
                {renderNavItems(group.routes)}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* 2. Mobile Nav Backdrop */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/40 z-40 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 3. Mobile Slide-out Drawer Sidebar */}
      <aside 
        className={cn(
          "md:hidden fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl transition-transform duration-300 flex flex-col transform",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <Link href="/studentdashboard" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-800 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-teal-800/10">
              <GraduationCap className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-teal-950 to-slate-800 bg-clip-text text-transparent">
              Examshala
            </span>
          </Link>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {routeGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              <h4 className="text-[10px] font-extrabold text-slate-400 px-3 uppercase tracking-wider">
                {group.title}
              </h4>
              <div className="space-y-0.5">
                {renderNavItems(group.routes, true)}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* 4. Fallback Mobile Bottom Nav (Clean indicator for primary screens, keeping lightweight feel) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200/60 z-30 px-6 py-3 flex justify-between items-center shadow-[0_-8px_30px_rgb(0,0,0,0.02)] safe-area-pb">
        {studentPortalRoutes.slice(0, 4).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-200",
                isActive ? "text-teal-700 scale-105 font-bold" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-teal-700" : "text-slate-400")} />
              <span className="text-[9px] font-extrabold uppercase tracking-wide">{item.label}</span>
            </Link>
          );
        })}
        {/* Interactive Hamburger button at the bottom-right to toggle complete mobile drawer */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900"
        >
          <Menu className="w-5 h-5 text-slate-400" />
          <span className="text-[9px] font-extrabold uppercase tracking-wide">Menu</span>
        </button>
      </nav>
    </>
  );
}
