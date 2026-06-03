'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useUserStore, type UserProfile } from '@/store/useUserStore';

type UserContextType = {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  loadProfile: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const user = useUserStore((s) => s.user);
  const loading = useUserStore((s) => s.loading);
  const setUser = useUserStore((s) => s.setUser);
  const loadProfile = useUserStore((s) => s.loadProfile);
  const switchWorkspace = useUserStore((s) => s.switchWorkspace);

  useEffect(() => {
    loadProfile().catch(() => undefined);
  }, [loadProfile]);

  return <UserContext.Provider value={{ user, loading, setUser, loadProfile, switchWorkspace }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}

