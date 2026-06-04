'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  ClipboardList, 
  Database, 
  FileText, 
  GraduationCap, 
  BarChart3, 
  MessageSquare, 
  Settings,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  LayoutGrid,
  ArrowLeftRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUser } from '@/context/UserContext';

const navItems = [
  { name: 'Dashboard', href: '/tutordashboard', icon: LayoutDashboard },
  { name: 'My Classes', href: '/tutordashboard/classes', icon: GraduationCap },
  { name: 'Students', href: '/tutordashboard/students', icon: Users },
  { name: 'Attendance', href: '/tutordashboard/attendance', icon: CalendarCheck },
  { name: 'Assessment', icon: LayoutGrid, isHeader: true },
  { name: 'Question Bank', href: '/tutordashboard/questions', icon: Database, indent: true },
  { name: 'Question Papers', href: '/tutordashboard/papers', icon: FileText, indent: true },
  { name: 'Results', href: '/tutordashboard/results', icon: BarChart3 },
  { name: 'Messages', href: '/tutordashboard/messages', icon: MessageSquare },
  { name: 'Settings', href: '/tutordashboard/settings', icon: Settings },
];

export const TeacherSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user: profile } = useUser();

  const isPrincipal = profile?.role?.toLowerCase() === 'principal';

  const handleSignOut = () => {
    document.cookie = 'session_token=; path=/; max-age=0; SameSite=Lax';
    try {
      localStorage.removeItem('token');
    } catch {
      // ignore
    }
    router.push('/signin');
    router.refresh();
  };



  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col overflow-y-auto">
      <div className="p-6">
        <Link href="/tutordashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Examshala</span>
        </Link>
      </div>



      <nav className="flex-1 px-4 space-y-1 pb-8">
        {navItems.map((item) => {
          if (item.isHeader) {
            return (
              <div key={item.name} className="pt-4 pb-2 px-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.name}</p>
              </div>
            );
          }

          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href!}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium',
                isActive 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                item.indent && 'ml-4'
              )}
            >
              <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-1">


        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export const TeacherHeader = () => {
  const { user: profile } = useUser();

  const displayName = profile?.name || 'Teacher';
  const displayRole = profile?.role?.toLowerCase() === 'principal' ? 'Principal' : 'Teacher';
  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 px-8 flex items-center justify-between">
      <div className="flex items-center gap-6">
        {/* Workspace Switcher */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-100 transition-colors">
          <div className="w-6 h-6 bg-indigo-100 rounded flex items-center justify-center">
            <span className="text-indigo-600 font-bold text-xs">🏫</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-900 leading-none">{profile?.workspaceName || 'School'}</span>
            <span className="text-[10px] text-gray-500 leading-none mt-0.5">2024–25</span>
          </div>
          <ChevronDown size={14} className="text-gray-400 ml-2" />
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-gray-200 mx-1"></div>

        <button className="flex items-center gap-2 pl-2 hover:bg-gray-100 rounded-lg transition-colors py-1 px-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 leading-none">{displayName}</p>
            <p className="text-[10px] text-gray-500 mt-1">{displayRole}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs border border-indigo-500 shadow-sm">
            {initials}
          </div>
        </button>
      </div>
    </header>
  );
};
