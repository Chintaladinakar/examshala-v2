import React from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';

export default function StudentMaterialsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight select-none">Materials</h1>
      
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-3xs p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
        {/* Premium SVG book library illustration */}
        <div className="w-16 h-16 rounded-2xl bg-teal-50/50 flex items-center justify-center mb-5 border border-teal-100/50 text-teal-600 transition-transform hover:scale-105 select-none">
          <BookOpen className="w-8 h-8" />
        </div>
        
        <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">No Materials Yet</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
          Course syllabus, reference PDFs, study guides, worksheets, and lecture videos will appear here.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link 
            href="/studentdashboard/exams" 
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-200 select-none cursor-pointer"
          >
            Practice Exams <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <Link 
            href="/studentdashboard" 
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60 text-xs font-bold rounded-xl transition-all duration-200 select-none cursor-pointer"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

