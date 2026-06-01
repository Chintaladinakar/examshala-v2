'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, PlusCircle, UserPlus, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WorkspaceOnboardingPage() {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = 'session_token=; path=/; max-age=0; SameSite=Lax';
    router.push('/signin');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 font-sans relative overflow-hidden select-none">
      
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white text-teal-950 font-black rounded-lg flex items-center justify-center text-base shadow-lg">
            E
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">
            Examshala
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" /> Sign Out
        </button>
      </header>

      {/* Main onboarding container */}
      <main className="max-w-4xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center flex-1 z-10">
        <div className="text-center space-y-3 max-w-xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-500/20 bg-teal-500/10 text-teal-300">
            <Sparkles className="w-3 h-3 text-teal-400" /> Welcome to Examshala
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Set up your workspace
          </h1>
          <p className="text-slate-400 text-xs md:text-sm font-semibold leading-relaxed">
            To begin using the examination system, tuition portal, and LMS, you must establish an institution workspace or link to an existing one.
          </p>
        </div>

        {/* Dynamic Options Grid */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
          
          {/* Card 1: Create Workspace */}
          <Link
            href="/workspace/create"
            className="group relative flex flex-col justify-between p-8 bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 rounded-3xl hover:bg-slate-900/90 transition-all duration-300 cursor-pointer shadow-xl"
          >
            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform duration-200">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white group-hover:text-teal-300 transition-colors">
                  Create New Workspace
                </h3>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">
                  Register a school, tuition center, coaching institute, or college. Request administrative credentials to act as the Principal.
                </p>
              </div>
            </div>

            <div className="pt-6 flex items-center gap-1.5 text-xs font-black text-teal-400 group-hover:translate-x-1 transition-transform">
              Start Institution Request <span>→</span>
            </div>
          </Link>

          {/* Card 2: Join Workspace */}
          <Link
            href="/workspace/join"
            className="group relative flex flex-col justify-between p-8 bg-slate-900/60 border border-slate-800 hover:border-violet-500/40 rounded-3xl hover:bg-slate-900/90 transition-all duration-300 cursor-pointer shadow-xl"
          >
            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform duration-200">
                <UserPlus className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white group-hover:text-violet-300 transition-colors">
                  Join Existing Workspace
                </h3>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">
                  Join an established academy using a unique institution invitation link or a custom Join Code distributed by your Principal.
                </p>
              </div>
            </div>

            <div className="pt-6 flex items-center gap-1.5 text-xs font-black text-violet-400 group-hover:translate-x-1 transition-transform">
              Join Existing Academy <span>→</span>
            </div>
          </Link>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-[10px] text-slate-600 font-medium z-10">
        © {new Date().getFullYear()} Examshala Examination Portal. All Rights Reserved.
      </footer>
    </div>
  );
}
