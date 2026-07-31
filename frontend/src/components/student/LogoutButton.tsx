"use client";

import React from 'react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await fetch('/api/auth/session', { method: 'DELETE' });
        try {
          localStorage.removeItem('token');
        } catch {
          // ignore
        }
        router.push('/signin');
        router.refresh();
      }}
      className="text-xs font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-100/50 transition-all duration-200"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
}

