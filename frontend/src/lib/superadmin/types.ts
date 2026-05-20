import type { UserWorkspace } from '@/types/superadmin';

export type SuperAdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  globalRole: 'superadmin' | 'user';
  workspaces: UserWorkspace[];
};

export type SuperAdminWorkspace = {
  id: string;
  name: string;
  createdAt: string;
  userCount: number;
  status: string;
};

export type SuperAdminResult = import('@/types/superadmin').Result;

export type PlatformSettings = {
  platformName?: string;
  supportEmail?: string;
};

export type ApiListResponse<T> = { success?: boolean; data?: T };
