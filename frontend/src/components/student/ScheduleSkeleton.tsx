import React from 'react';

export function ScheduleSkeleton() {
  return (
    <div className="space-y-8 select-none animate-pulse">
      {/* 1. Header Breadcrumb Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-32 bg-slate-200 rounded-sm"></div>
        <div className="h-8 w-48 bg-slate-200 rounded-md"></div>
        <div className="h-4 w-96 bg-slate-100 rounded-sm"></div>
      </div>



      {/* 4. Vertical Timeline Content Skeleton */}
      <div className="relative pl-6 md:pl-10 space-y-8 before:absolute before:inset-y-0 before:left-3 md:before:left-5 before:w-0.5 before:bg-slate-100">
        {[1, 2, 3].map((card) => (
          <div key={card} className="relative group">
            {/* Timeline indicator node */}
            <div className="absolute left-[-23px] md:left-[-30px] top-4 w-4 h-4 rounded-full bg-slate-200 border-4 border-white group-hover:scale-110 transition-transform"></div>

            {/* Event card body skeleton */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-5 w-20 bg-slate-200 rounded-md"></div>
                  <div className="h-5 w-16 bg-slate-150 rounded-md"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-5.5 w-3/4 bg-slate-200 rounded-sm"></div>
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-32 bg-slate-150 rounded-sm"></div>
                    <div className="h-4 w-28 bg-slate-100 rounded-sm"></div>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-auto shrink-0 flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                <div className="h-9 w-24 bg-slate-100 rounded-xl"></div>
                <div className="h-9 w-28 bg-slate-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
