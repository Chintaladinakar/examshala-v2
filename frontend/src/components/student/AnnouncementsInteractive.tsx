'use client';

import React, { useState, useTransition } from 'react';
import { Megaphone, Search, ExternalLink } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

type Announcement = {
  id: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  createdAt: string;
};

export function AnnouncementsInteractive({ initialData }: { initialData: Announcement[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [isPending, startTransition] = useTransition();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set('search', query.trim());
      router.push(`/studentdashboard/announcements${params.toString() ? `?${params}` : ''}`);
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-400">Communication</p>
        <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
        <p className="text-sm text-slate-500">Institution-wide updates and notices.</p>
      </div>

      <form onSubmit={submitSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search announcements..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors"
        >
          Search
        </button>
      </form>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs overflow-hidden">
        {initialData.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No announcements found.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {initialData.map((a) => (
              <div key={a.id} className="p-6 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-900">{a.title}</h3>
                    <span className="text-xs text-slate-400 shrink-0">
                      {new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{a.message}</p>
                  {a.actionUrl && (
                    <a
                      href={a.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 mt-2"
                    >
                      Learn more <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
