'use client';

import React, { useEffect, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { Settings as SettingsIcon, Lock, Bell, Save } from 'lucide-react';

type NotificationPrefs = {
  emailAssignmentSubmitted: boolean;
  emailExamCompleted: boolean;
  emailAnnouncements: boolean;
  emailMessages: boolean;
  inAppNotifications: boolean;
};

const PREF_LABELS: { key: keyof NotificationPrefs; label: string }[] = [
  { key: 'emailAssignmentSubmitted', label: 'Email me when a student submits an assignment' },
  { key: 'emailExamCompleted', label: 'Email me when a student completes an exam' },
  { key: 'emailAnnouncements', label: 'Email me about workspace announcements' },
  { key: 'emailMessages', label: 'Email me about new messages' },
  { key: 'inAppNotifications', label: 'Enable in-app notifications' },
];

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || body?.message || 'Request failed');
  }
  return body.data as T;
}

export default function SettingsPage() {
  const { showError, showMessage } = useToast();

  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    apiJson<NotificationPrefs>('/api/settings/notifications').then(setPrefs).catch(showError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function savePrefs() {
    if (!prefs) return;
    setSavingPrefs(true);
    try {
      const updated = await apiJson<NotificationPrefs>('/api/settings/notifications', {
        method: 'PATCH',
        body: JSON.stringify(prefs),
      });
      setPrefs(updated);
      showMessage('Notification preferences saved', 'success');
    } catch (e) {
      showError(e);
    } finally {
      setSavingPrefs(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError(new Error('New password and confirmation do not match.'));
      return;
    }
    setSavingPassword(true);
    try {
      await apiJson('/api/settings/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
      });
      showMessage('Password changed successfully', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      showError(e);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="pb-4 border-b">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <SettingsIcon className="w-8 h-8 text-teal-850" />
              Settings
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">Manage your account security and notification preferences.</p>
          </div>

          <div className="bg-white border rounded-3xl shadow-xs p-6 space-y-4">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-800" /> Change Password
            </h2>
            <form onSubmit={changePassword} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">Current Password</label>
                <input
                  required
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">New Password</label>
                  <input
                    required
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Confirm New Password</label>
                  <input
                    required
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-4 py-2 bg-teal-900 hover:bg-teal-800 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border rounded-3xl shadow-xs p-6 space-y-4">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-800" /> Notification Preferences
            </h2>
            {!prefs ? (
              <p className="text-xs text-slate-400 font-bold">Loading...</p>
            ) : (
              <div className="space-y-3">
                {PREF_LABELS.map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between gap-4 text-xs font-semibold text-slate-700">
                    {label}
                    <input
                      type="checkbox"
                      checked={prefs[key]}
                      onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </label>
                ))}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={savePrefs}
                    disabled={savingPrefs}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-900 hover:bg-teal-800 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" /> {savingPrefs ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
