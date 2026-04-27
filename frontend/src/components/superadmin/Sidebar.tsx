"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Building2, Settings, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/superadmin/users', label: 'Users', icon: Users },
  { href: '/superadmin/workspaces', label: 'Workspaces', icon: Building2 },
  { href: '/superadmin/results', label: 'Results', icon: Activity },
  { href: '/superadmin/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  platformName?: string;
}

export function Sidebar({ platformName = "Examshala" }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white min-h-screen">
        <div className="p-6 border-b border-slate-100 mb-4">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-indigo-700 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xl leading-none">
                {platformName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">{platformName}</span>
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Super Admin</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm",
                  isActive 
                    ? "bg-indigo-50 text-indigo-800" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-700" : "text-slate-400")} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-6 py-3 flex justify-between items-center safe-area-pb">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1",
                isActive ? "text-indigo-700" : "text-slate-500"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-700" : "text-slate-400")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  );
}
