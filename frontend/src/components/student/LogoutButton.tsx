"use client";

import React from 'react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        document.cookie = 'session_token=; path=/; max-age=0; SameSite=Lax';
        try {
          localStorage.removeItem('token');
        } catch {
          // ignore
        }
        router.push('/signin');
        router.refresh();
      }}
      className="text-sm font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Logout</span>
    </button>
  );
}

