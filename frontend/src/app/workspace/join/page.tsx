'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';
import {
  Sparkles,
  UserPlus,
  KeyRound,
  GraduationCap,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Building2
} from 'lucide-react';

async function apiPost<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const resBody = (await res.json().catch(() => null)) as any;
  if (!res.ok || !resBody?.success) {
    throw new Error(resBody?.error?.message || 'Failed to request joining workspace');
  }
  return resBody.data as T;
}

export default function WorkspaceJoinPage() {
  const router = useRouter();
  const { showError, showMessage } = useToast();

  const [joinCode, setJoinCode] = useState('');
  const [requestedRole, setRequestedRole] = useState('Tutor');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [joinedWorkspaceName, setJoinedWorkspaceName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim();
    if (!cleanCode) return showMessage('Please input a valid Workspace Code.', 'info');

    try {
      setLoading(true);
      const res = await apiPost<any>('/api/principal/join-request', {
        joinCode: cleanCode,
        requestedRole
      });
      setJoinedWorkspaceName(res.workspaceName || 'Requested Academy');
      setSubmitted(true);
      showMessage('Your access request has been sent to the workspace Principal.', 'success');
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToOnboarding = () => {
    router.push('/workspace/onboarding');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-y-auto select-none">
      
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-900 z-10">
        <div className="flex items-center gap-2.5" onClick={handleBackToOnboarding}>
          <div className="w-7 h-7 bg-white text-teal-950 font-black rounded-lg flex items-center justify-center text-sm shadow-md cursor-pointer">
            E
          </div>
          <span className="font-extrabold text-base tracking-tight text-white cursor-pointer">
            Examshala
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-extrabold uppercase bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
          Institution Access Portal
        </span>
      </header>

      {/* Main Join Box */}
      <main className="max-w-md w-full mx-auto px-6 py-12 flex-1 flex items-center justify-center z-10">
        
        {!submitted ? (
          <div className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 md:p-8 w-full shadow-2xl backdrop-blur-3xs space-y-6">
            
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                <UserPlus className="w-5 h-5 text-teal-400 animate-pulse" /> Join Institution
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Link with an established workspace utilizing a Join Code.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Workspace Join Code *</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value)}
                    placeholder="e.g. EXM-ABC-8421"
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold uppercase tracking-wider focus:outline-none focus:border-teal-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Select Requested Role *</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Tutor role card */}
                  <div
                    onClick={() => setRequestedRole('Tutor')}
                    className={`p-4 border rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      requestedRole === 'Tutor'
                        ? 'bg-teal-500/10 border-teal-500 text-teal-300 shadow-md shadow-teal-500/5'
                        : 'bg-slate-950 border-slate-850 text-slate-500 hover:border-slate-750'
                    }`}
                  >
                    <Briefcase className="w-5 h-5 mb-1.5" />
                    <span className="text-[10px] font-black uppercase">Tutor / Faculty</span>
                  </div>

                  {/* Student role card */}
                  <div
                    onClick={() => setRequestedRole('Student')}
                    className={`p-4 border rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      requestedRole === 'Student'
                        ? 'bg-teal-500/10 border-teal-500 text-teal-300 shadow-md shadow-teal-500/5'
                        : 'bg-slate-950 border-slate-850 text-slate-500 hover:border-slate-750'
                    }`}
                  >
                    <GraduationCap className="w-5 h-5 mb-1.5" />
                    <span className="text-[10px] font-black uppercase">Student</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={handleBackToOnboarding}
                  className="px-4 py-2.5 border border-slate-800 hover:bg-slate-800 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      Request Access <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* SUCCESS SUBMISSION PANEL */
          <div className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 md:p-8 w-full shadow-2xl text-center space-y-5 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-300 text-[9px] font-black uppercase tracking-wider">
                ⏳ Pending Approval
              </span>
              <h3 className="text-base font-black text-white">{joinedWorkspaceName}</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-semibold max-w-xs mx-auto">
                Your request to join the workspace has been successfully sent to the Principal.
              </p>
            </div>

            <div className="bg-slate-950/70 p-4 border border-slate-850 rounded-2xl text-[10px] text-left space-y-2">
              <div className="flex justify-between items-center text-slate-400 font-bold">
                <span>Requested Role:</span>
                <span className="font-extrabold text-white uppercase">{requestedRole}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 font-bold border-t border-slate-850 pt-2">
                <span>Status:</span>
                <span className="text-amber-400 font-black">Awaiting Principal Review</span>
              </div>
            </div>

            <button
              onClick={handleBackToOnboarding}
              className="w-full py-2.5 bg-slate-100 hover:bg-white text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              Return to Onboarding
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-[10px] text-slate-700 font-medium z-10 border-t border-slate-900">
        © {new Date().getFullYear()} Examshala Examination Portal.
      </footer>
    </div>
  );
}
