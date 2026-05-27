import React from 'react';

export function ExamsSkeleton() {
  return (
    <div className="space-y-8 select-none animate-pulse">
      {/* Stats Row Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((stat) => (
          <div key={stat} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="space-y-1.5 flex-1 pr-2">
              <div className="h-3 w-16 bg-slate-150 rounded-sm"></div>
              <div className="h-5 w-10 bg-slate-200 rounded-sm"></div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 shrink-0"></div>
          </div>
        ))}
      </div>

      {/* Featured Nearest Exam Card Skeleton */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-5 w-32 bg-slate-200 rounded-md"></div>
            <div className="h-5 w-20 bg-slate-150 rounded-md"></div>
          </div>
          <div className="space-y-2">
            <div className="h-6 w-3/4 bg-slate-200 rounded-sm"></div>
            <div className="h-4 w-1/3 bg-slate-150 rounded-sm"></div>
          </div>
        </div>
        <div className="w-full md:w-auto shrink-0 flex items-center gap-3">
          <div className="h-9 w-24 bg-slate-100 rounded-xl"></div>
          <div className="h-9 w-28 bg-slate-200 rounded-xl"></div>
        </div>
      </div>

      {/* Search & Filter Header Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between pb-4 border-b border-slate-100">
        <div className="h-9 w-64 bg-slate-200 rounded-xl"></div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-16 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>

      {/* 3-Column Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((card) => (
          <div 
            key={card} 
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs flex flex-col justify-between min-h-[300px]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 w-20 bg-slate-200 rounded-md"></div>
                <div className="h-5 w-16 bg-slate-150 rounded-md"></div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="h-5 w-5/6 bg-slate-200 rounded-sm"></div>
                <div className="h-4 w-1/2 bg-slate-150 rounded-sm"></div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="h-3.5 w-full bg-slate-100 rounded-sm"></div>
                <div className="h-3.5 w-2/3 bg-slate-100 rounded-sm"></div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
              <div className="h-3.5 w-20 bg-slate-150 rounded-sm"></div>
              <div className="h-8 w-28 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
