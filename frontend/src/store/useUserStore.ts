'use client';

import { create } from 'zustand';

export type UserRole = 'principal' | 'teacher' | 'tutor' | 'student' | 'parent' | 'org_admin' | 'admin' | 'superadmin' | string;
export type UserMode = 'principal' | 'teacher';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mode: UserMode | null;
  workspaceId: string | null;
  workspaceName: string;
  workspaces?: { id: string; name: string; role: string }[] | null;
};

type UserStore = {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  loadProfile: () => Promise<void>;
  switchMode: () => Promise<UserMode | null>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
};

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  loadProfile: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/school/profile', { credentials: 'include' });
      const body = await safeJson<{ success?: boolean; data?: UserProfile }>(res);
      if (!res.ok || !body?.success || !body.data) {
        set({ user: null });
        return;
      }
      set({ user: body.data });
    } finally {
      set({ loading: false });
    }
  },
  switchMode: async () => {
    const current = get().user;
    if (!current) return null;
    const res = await fetch('/api/switch-mode', { method: 'POST', credentials: 'include' });
    const body = await safeJson<{ success?: boolean; data?: UserProfile }>(res);
    if (!res.ok || !body?.success || !body.data) throw new Error('Failed to switch mode');
    set({ user: body.data });
    const mode = (body.data.mode || 'principal').toLowerCase() === 'teacher' ? 'teacher' : 'principal';
    return mode;
  },
  switchWorkspace: async (workspaceId: string) => {
    const res = await fetch('/api/school/switch-workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId }),
      credentials: 'include',
    });
    const body = await safeJson<{ success?: boolean; data?: UserProfile }>(res);
    if (!res.ok || !body?.success || !body.data) throw new Error('Failed to switch workspace');
    set({ user: body.data });
  },
}));

