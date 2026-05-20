import { fetchJson } from '@/lib/api';
import { logDeveloperError } from '@/lib/error-handler';
import type {
  ApiListResponse,
  PlatformSettings,
  SuperAdminUser,
  SuperAdminWorkspace,
  SuperAdminResult,
} from '@/lib/superadmin/types';
import { platformSettingsMock } from '@/lib/superadmin/mock';

export async function getPlatformSettings(token: string): Promise<PlatformSettings> {
  try {
    const payload = await fetchJson<{ data?: PlatformSettings }>('/api/superadmin/settings', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      action: 'load',
    });
    return payload.data ?? platformSettingsMock;
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'superadmin_settings_adapter' });
    return platformSettingsMock;
  }
}

export async function getSuperAdminUsers(token: string): Promise<SuperAdminUser[]> {
  try {
    const payload = await fetchJson<ApiListResponse<unknown>>('/api/superadmin/users', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      action: 'load',
    });
    const raw = Array.isArray(payload.data) ? payload.data : [];
    return raw.map((u) => {
      const r = (u && typeof u === 'object') ? (u as Record<string, unknown>) : {};
      const id = typeof r.id === 'string' ? r.id : '';
      const name = typeof r.name === 'string' ? r.name : '';
      const email = typeof r.email === 'string' ? r.email : '';
      const role = typeof r.role === 'string' ? r.role : 'user';
      const createdAt = typeof r.createdAt === 'string' ? r.createdAt : new Date(0).toISOString();
      const isActive = typeof r.isActive === 'boolean' ? r.isActive : true;
      return {
        id,
        name,
        email,
        role,
        isActive,
        createdAt,
        globalRole: role === 'superadmin' ? 'superadmin' : 'user',
        workspaces: [],
      };
    });
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'superadmin_users_adapter' });
    return [];
  }
}

export async function getSuperAdminWorkspaces(token: string): Promise<SuperAdminWorkspace[]> {
  try {
    const payload = await fetchJson<ApiListResponse<SuperAdminWorkspace[]>>('/api/superadmin/workspaces', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      action: 'load',
    });
    return Array.isArray(payload.data) ? payload.data : [];
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'superadmin_workspaces_adapter' });
    return [];
  }
}

export async function getSuperAdminResults(token: string): Promise<SuperAdminResult[]> {
  try {
    const payload = await fetchJson<ApiListResponse<unknown>>('/api/superadmin/results', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      action: 'load',
    });
    return Array.isArray(payload.data) ? (payload.data as SuperAdminResult[]) : [];
  } catch (err) {
    logDeveloperError(err, { action: 'load', feature: 'superadmin_results_adapter' });
    return [];
  }
}
