'use client';

import { useUser } from '@/context/UserContext';

export function Navbar() {
  const { user } = useUser();

  const role = (user?.role || '').toLowerCase();

  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="font-black text-slate-900">EDUsphere School</div>
          {user?.workspaceName ? <span className="text-xs text-slate-500">Workspace: {user.workspaceName}</span> : null}
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="text-sm text-slate-700">
              <span className="font-semibold">{user.name}</span> <span className="text-slate-500">({role})</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
