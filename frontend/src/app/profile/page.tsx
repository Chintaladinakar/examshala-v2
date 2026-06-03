'use client';

import React, { useState, useEffect } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { fetchJson } from '@/lib/api';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  mode: string | null;
  workspaceId: string | null;
  workspaceName: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = getCookie('session_token');
      if (!token) return;
      
      const response = await fetchJson<{ success: boolean; data: UserProfile }>('/api/school/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.success && response.data) {
        setProfile(response.data);
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const isPrincipal = profile?.role.toLowerCase() === 'principal';

  return (
    <div className="flex min-h-screen bg-[#FDFBF7]">
      <DashboardSidebar />

      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">User Profile</h1>
            <p className="text-slate-500 mt-1">Review account role permissions and tenant settings.</p>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-8 space-y-6 animate-pulse">
              <div className="h-6 bg-slate-100 rounded w-1/4"></div>
              <div className="h-24 bg-slate-100 rounded-2xl"></div>
              <div className="h-24 bg-slate-100 rounded-2xl"></div>
            </div>
          ) : !profile ? (
            <div className="text-center p-12 text-slate-400">
              <p>Failed to sync user session.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Profile Card */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-teal-900 text-teal-100 text-xl font-bold flex items-center justify-center shadow-md select-none shrink-0">
                  {profile.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1.5 text-center sm:text-left min-w-0">
                  <h2 className="text-xl font-black text-slate-800 leading-none tracking-tight">{profile.name}</h2>
                  <p className="text-slate-450 text-xs">{profile.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1.5">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-100/60 text-teal-800 uppercase tracking-wider">
                      🛡️ base role: {profile.role}
                    </span>
                    {profile.workspaceName && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-250 text-slate-650 uppercase tracking-wider">
                        🏫 {profile.workspaceName}
                      </span>
                    )}
                  </div>
                </div>
              </div>


              {/* Info panel */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-xs text-slate-450 leading-relaxed">
                ℹ️ **System Security Information**: Access tokens are stored locally. Roles and workspace mappings are managed globally by platform admins. If you require access updates or workspace linkages, please contact your Organization Administrator.
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
