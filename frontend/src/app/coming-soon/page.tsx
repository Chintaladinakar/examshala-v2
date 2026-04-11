import Link from 'next/link';
import React from 'react';

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 text-slate-800 font-sans selection:bg-teal-100 selection:text-teal-900">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-10 md:p-16 text-center border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
        
        {/* Dramatic background effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-100/50 via-white to-transparent opacity-50 blur-2xl -z-10 pointer-events-none"></div>

        <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm border border-amber-100/50 transform -rotate-6">
          <span className="text-4xl">🚧</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          Hold your horses!
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-10">
          Our developers are locked in the basement fueled entirely by caffeine and existential dread, furiously typing away to build this page. 
          <br/><br/>
          It's going to be <span className="font-semibold text-teal-700 italic">magnificent</span>... once it actually exists. 
        </p>

        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white font-medium rounded-xl shadow-sm hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Take me back to safety
        </Link>
      </div>
    </div>
  );
}
