'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ClipboardList, ClipboardCheck, Megaphone, Search } from 'lucide-react';
import type { StudentSearchResults } from '@/lib/student/data';

export function SearchResultsInteractive({ query, results }: { query: string; results: StudentSearchResults }) {
  const router = useRouter();
  const [value, setValue] = useState(query);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      router.push(`/studentdashboard/search?q=${encodeURIComponent(value.trim())}`);
    }
  };

  const totalCount =
    results.materials.length + results.assignments.length + results.exams.length + results.announcements.length;

  const sections = [
    { key: 'materials', label: 'Study Materials', icon: FileText, items: results.materials, color: 'bg-indigo-50 text-indigo-600' },
    { key: 'assignments', label: 'Assignments', icon: ClipboardList, items: results.assignments, color: 'bg-amber-50 text-amber-600' },
    { key: 'exams', label: 'Exams', icon: ClipboardCheck, items: results.exams, color: 'bg-emerald-50 text-emerald-600' },
    { key: 'announcements', label: 'Announcements', icon: Megaphone, items: results.announcements, color: 'bg-teal-50 text-teal-600' },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-400">Search</p>
        <h1 className="text-2xl font-bold text-slate-900">Search Results</h1>
      </div>

      <form onSubmit={submit} className="relative max-w-xl">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search across materials, assignments, exams, announcements..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
        />
      </form>

      {query && (
        <p className="text-sm text-slate-500">
          {totalCount} result{totalCount === 1 ? '' : 's'} for &ldquo;{query}&rdquo;
        </p>
      )}

      {query && totalCount === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs p-10 text-center text-sm text-slate-400">
          No results found. Try a different search term.
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => {
            if (section.items.length === 0) return null;
            const Icon = section.icon;
            return (
              <div key={section.key} className="bg-white rounded-3xl border border-slate-100 shadow-3xs overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <h2 className="font-semibold text-slate-900 text-sm">{section.label}</h2>
                </div>
                <div className="divide-y divide-slate-50">
                  {section.items.map((item: any) => (
                    <div key={item.id} className="p-4 px-5 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${section.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
