"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/studentdashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/studentdashboard/results', label: 'Results', icon: FileText },
  { href: '/studentdashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/studentdashboard/profile', label: 'Profile', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white min-h-screen">
        <div className="p-6 border-b border-slate-100 mb-4">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xl leading-none">E</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Examshala</span>
          </Link>
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
                    ? "bg-teal-50 text-teal-800" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-teal-700" : "text-slate-400")} />
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
                isActive ? "text-teal-700" : "text-slate-500"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-teal-700" : "text-slate-400")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  );
}
