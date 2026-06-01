'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';
import {
  Sparkles,
  ShieldAlert,
  Calendar,
  ChevronRight,
  RefreshCw,
  PartyPopper,
  XCircle,
  FileCheck2,
  ExternalLink
} from 'lucide-react';

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || 'Failed to fetch status');
  }
  return body.data as T;
}

export default function WorkspaceRequestStatusPage() {
  const router = useRouter();
  const { showError, showMessage } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);

  async function loadStatus() {
    try {
      setLoading(true);
      const res = await apiGet<any[]>('/api/principal/workspace-request');
      setRequests(res);
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  const activeRequest = requests[0]; // Fetch the most recent request

  const handleNavigateToSetup = () => {
    // If approved, proceed directly to onboarding configuration setup
    router.push('/workspace/setup');
  };

  const handleRestartRequest = () => {
    router.push('/workspace/create');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-y-auto select-none">
      
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-900 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white text-teal-950 font-black rounded-lg flex items-center justify-center text-sm shadow-md">
            E
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            Examshala
          </span>
        </div>
        
        <button
          onClick={loadStatus}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-800 hover:bg-slate-800 text-[10px] font-extrabold text-slate-400 rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
        </button>
      </header>

      {/* Main Status Panel */}
      <main className="max-w-md w-full mx-auto px-6 py-12 flex-1 flex items-center justify-center z-10">
        
        {loading ? (
          <div className="text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
            <p className="text-xs font-bold text-slate-400">Loading request pipeline status...</p>
          </div>
        ) : !activeRequest ? (
          <div className="bg-slate-900/60 border border-slate-850 rounded-3xl p-8 text-center space-y-4 max-w-sm">
            <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-lg font-black text-white">No Request Found</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-semibold">
              You haven't submitted any workspace creation requests yet. Establish an institution request to begin.
            </p>
            <button
              onClick={handleRestartRequest}
              className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              Submit Workspace Request
            </button>
          </div>
        ) : (
          <div className="w-full">
            {/* ───── PENDING STATE ───── */}
            {activeRequest.status === 'PENDING' && (
              <div className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 md:p-8 space-y-6 text-center animate-in fade-in duration-200">
                <div className="w-14 h-14 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                  <FileCheck2 className="w-7 h-7" />
                </div>
                
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-wider">
                    ⏳ Pending Review
                  </span>
                  <h3 className="text-xl font-black text-white">{activeRequest.name}</h3>
                  <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Your workspace request is currently under review by the Examshala Super Admins.
                  </p>
                </div>

                <div className="bg-slate-950/70 p-4 border border-slate-850 rounded-2xl text-left space-y-3.5">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-850 pb-2">
                    <span>Submitted Date</span>
                    <span className="text-white font-extrabold">{new Date(activeRequest.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-b border-slate-850 pb-2">
                    <span>Queue Status</span>
                    <span className="text-amber-400 font-black">Under Administrative Review</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>Expected Review Time</span>
                    <span className="text-teal-400 font-extrabold">24–48 Hours</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/40 p-3.5 border border-slate-850 rounded-xl text-left">
                  <span className="text-base">📢</span>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    We will notify you via email as soon as the verification succeeds. Thank you for your patience!
                  </p>
                </div>
              </div>
            )}

            {/* ───── REJECTED STATE ───── */}
            {activeRequest.status === 'REJECTED' && (
              <div className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 md:p-8 space-y-6 text-center animate-in fade-in duration-200">
                <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
                  <XCircle className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-wider">
                    ❌ Request Rejected
                  </span>
                  <h3 className="text-xl font-black text-white">{activeRequest.name}</h3>
                  <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Unfortunately, your workspace verification request was not approved.
                  </p>
                </div>

                <div className="bg-rose-500/5 p-4 border border-rose-500/15 rounded-2xl text-left space-y-2">
                  <h4 className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider">Rejection Reason</h4>
                  <p className="text-[11px] text-slate-350 leading-relaxed font-semibold">
                    {activeRequest.rejectionReason || 'Incomplete institution information or duplicate registration request.'}
                  </p>
                </div>

                <button
                  onClick={handleRestartRequest}
                  className="w-full py-2.5 bg-slate-100 hover:bg-white text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  Submit New Request <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ───── APPROVED STATE ───── */}
            {activeRequest.status === 'ACTIVE' && (
              <div className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 md:p-8 space-y-6 text-center animate-in fade-in duration-200">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                  <PartyPopper className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                    🎉 Approved & Active
                  </span>
                  <h3 className="text-xl font-black text-white">Congratulations!</h3>
                  <p className="text-xs font-semibold text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Your workspace **{activeRequest.name}** has been successfully approved. You are now the Principal.
                  </p>
                </div>

                <div className="bg-emerald-500/5 p-4 border border-emerald-500/15 rounded-2xl text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400 font-bold">Workspace Code:</span>
                    <span className="font-extrabold text-white bg-slate-950 border border-slate-800 px-2 py-0.5 rounded uppercase tracking-wider">
                      {activeRequest.code || 'EXM-ABC-8421'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed pt-1.5 border-t border-slate-850">
                    Use this workspace Join Code to let teachers and students easily register into your institution directory.
                  </p>
                </div>

                <button
                  onClick={handleNavigateToSetup}
                  className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  Go To Workspace Setup <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
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
