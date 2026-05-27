'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/components/ui/ToastProvider';

export function Navbar() {
  const router = useRouter();
  const { user, switchMode } = useUser();
  const { showError } = useToast();

  const role = (user?.role || '').toLowerCase();
  const mode = (user?.mode || 'principal').toLowerCase();
  const canSwitch = role === 'principal';

  async function onSwitch() {
    try {
      const nextMode = await switchMode();
      if (nextMode === 'teacher') router.push('/tutordashboard');
      else if (nextMode === 'principal') router.push('/principledashboard');
    } catch (e) {
      showError(e);
    }
  }

  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-black text-slate-900">Examshala School</div>
          {user?.workspaceName ? <span className="text-xs text-slate-500">Workspace: {user.workspaceName}</span> : null}
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="text-sm text-slate-700">
              <span className="font-semibold">{user.name}</span> <span className="text-slate-500">({role}{role === 'principal' ? ` • ${mode} mode` : ''})</span>
            </div>
          ) : null}
          {canSwitch ? (
            <button onClick={onSwitch} className="px-3 py-2 rounded-xl bg-teal-950 text-white text-sm font-semibold hover:bg-teal-900">
              Switch to {mode === 'teacher' ? 'Principal' : 'Teacher'} mode
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
