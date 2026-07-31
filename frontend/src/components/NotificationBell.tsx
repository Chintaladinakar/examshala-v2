'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string | null;
  createdAt: string;
};

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) throw new Error(body?.error?.message || body?.message || 'Request failed');
  return body.data as T;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function loadUnreadCount() {
    try {
      const data = await apiJson<{ unreadCount: number }>('/api/notifications/unread-count');
      setUnreadCount(data.unreadCount);
    } catch {
      // Silent — the bell is a convenience indicator, not critical path.
    }
  }

  async function loadNotifications() {
    try {
      const data = await apiJson<Notification[]>('/api/notifications');
      setNotifications(data);
    } catch {
      // no-op
    }
  }

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) await loadNotifications();
  }

  async function markRead(id: string) {
    try {
      await apiJson(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // no-op
    }
  }

  async function markAllRead() {
    try {
      await apiJson('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // no-op
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggleOpen}
        className="relative p-2.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-500 transition-all cursor-pointer select-none"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[10px] font-bold text-teal-700 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 font-bold text-center py-8">No notifications</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.actionUrl || '#'}
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={`block px-4 py-3 border-b border-slate-50 hover:bg-slate-50 ${!n.isRead ? 'bg-teal-50/40' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-800 truncate">{n.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
