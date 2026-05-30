"use client";

import React, { useState } from 'react';
import { User, ShieldCheck, Bell, KeyRound, Camera, Save, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { fetchJson } from '@/lib/api';
import InlineError from '@/components/ui/InlineError';
import { logDeveloperError } from '@/lib/error-handler';
import { useToast } from '@/components/ui/ToastProvider';

interface SettingsControllerProps {
  initialProfile: {
    studentId: string;
    fullName: string;
    email: string;
    mobileNumber: string;
    profilePhoto: string;
  };
  initialSettings: {
    assessmentNotifications: boolean;
    assignmentNotifications: boolean;
    announcementNotifications: boolean;
  };
}

export default function SettingsController({ initialProfile, initialSettings }: SettingsControllerProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'notifications'>('account');

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Nav for settings */}
      <div className="md:w-64 shrink-0 select-none">
        <nav className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
          <button
            onClick={() => setActiveTab('account')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm whitespace-nowrap cursor-pointer",
              activeTab === 'account' ? "bg-white text-teal-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <User className="w-4 h-4 text-teal-600" /> Account Settings
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm whitespace-nowrap cursor-pointer",
              activeTab === 'security' ? "bg-white text-teal-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <ShieldCheck className="w-4 h-4 text-teal-600" /> Security Settings
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-sm whitespace-nowrap cursor-pointer",
              activeTab === 'notifications' ? "bg-white text-teal-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Bell className="w-4 h-4 text-teal-600" /> Notifications
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-6">
        {activeTab === 'account' && <AccountSettingsTab profile={initialProfile} />}
        {activeTab === 'security' && <SecuritySettingsTab profile={initialProfile} />}
        {activeTab === 'notifications' && <NotificationPreferencesTab settings={initialSettings} />}
      </div>
    </div>
  );
}

function AccountSettingsTab({ profile }: { profile: any }) {
  const router = useRouter();
  const { showMessage } = useToast();
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [mobileNumber, setMobileNumber] = useState(profile.mobileNumber);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('session_token='))?.split('=')[1];
      await fetchJson('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ fullName, email, mobileNumber }),
        action: 'submit',
      });
      showMessage('Account information updated successfully.', 'success');
      router.refresh();
    } catch (err) {
      logDeveloperError(err, { action: 'submit', feature: 'update_account_info' });
      setError(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-3 flex items-center gap-2 select-none">
        <User className="w-5 h-5 text-teal-600" />
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Account Information</h2>
      </div>
      <InlineError error={error} action="submit" className="bg-rose-50 text-rose-600 px-4 py-2.5 rounded-xl text-sm" />
      <form onSubmit={handleSave} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1 select-none">Full Name</label>
          <input 
            type="text" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            required 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1 select-none">Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1 select-none">Mobile Number</label>
          <input 
            type="text" 
            value={mobileNumber} 
            onChange={(e) => setMobileNumber(e.target.value)} 
            required 
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
          />
        </div>
        <button 
          type="submit" 
          disabled={isSaving}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-205 flex items-center gap-2 select-none cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

function SecuritySettingsTab({ profile }: { profile: any }) {
  const router = useRouter();
  const { showMessage } = useToast();
  
  // Profile Picture state
  const [photoPreview, setPhotoPreview] = useState<string | null>(profile.profilePhoto || null);
  const [isPhotoSaving, setIsPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<unknown>(null);

  // Password Strength helper
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'No Password', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch(score) {
      case 1: return { score, text: 'Weak', color: 'bg-rose-500' };
      case 2: return { score, text: 'Fair', color: 'bg-amber-500' };
      case 3: return { score, text: 'Good', color: 'bg-indigo-500' };
      case 4: return { score, text: 'Strong', color: 'bg-emerald-500' };
      default: return { score, text: 'Very Weak', color: 'bg-rose-450' };
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (PNG/JPEG).');
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Image size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    setIsPhotoSaving(true);
    setPhotoError(null);

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('session_token='))?.split('=')[1];
      await fetchJson('/api/student/profile/photo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ profilePhoto: photoPreview || '' }),
        action: 'submit',
      });
      showMessage('Profile picture updated successfully.', 'success');
      router.refresh();
    } catch (err: any) {
      logDeveloperError(err, { action: 'submit', feature: 'update_photo' });
      setPhotoError(err.message || 'Failed to save photo.');
    } finally {
      setIsPhotoSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsPhotoSaving(true);
    setPhotoError(null);

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('session_token='))?.split('=')[1];
      await fetchJson('/api/student/profile/photo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ profilePhoto: '' }),
        action: 'submit',
      });
      setPhotoPreview(null);
      showMessage('Profile picture removed successfully.', 'success');
      router.refresh();
    } catch (err: any) {
      logDeveloperError(err, { action: 'submit', feature: 'remove_photo' });
      setPhotoError(err.message || 'Failed to remove photo.');
    } finally {
      setIsPhotoSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError(new Error('New passwords do not match.'));
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(new Error('New password must be at least 6 characters.'));
      return;
    }

    setIsPasswordSaving(true);

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('session_token='))?.split('=')[1];
      await fetchJson('/api/student/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
        action: 'submit',
      });
      showMessage('Password changed successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      logDeveloperError(err, { action: 'submit', feature: 'change_password' });
      setPasswordError(err);
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-6">
      
      {/* Photo settings card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2 select-none">
          <Camera className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Profile Picture Settings</h2>
        </div>

        {photoError && (
          <div className="bg-rose-50 text-rose-600 px-4 py-2.5 rounded-xl text-sm font-semibold select-none">
            {photoError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-24 h-24 rounded-full bg-teal-50 border-2 border-teal-500/20 flex items-center justify-center text-teal-700 overflow-hidden shrink-0 shadow-inner select-none animate-in fade-in duration-300">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-extrabold">{profile?.fullName ? profile.fullName[0].toUpperCase() : 'S'}</span>
            )}
          </div>
          
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <h4 className="font-bold text-slate-800 select-none">Adjust your avatar photo</h4>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-sm select-none">
              Supports JPG, JPEG, and PNG formats. Maximum allowed size is 2MB.
            </p>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 select-none">
              <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center">
                Choose Image File
                <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handlePhotoUpload} className="hidden" />
              </label>
              
              {photoPreview && (
                <>
                  <button 
                    onClick={handleSavePhoto} 
                    disabled={isPhotoSaving}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Save Photo
                  </button>
                  <button 
                    onClick={handleRemovePhoto} 
                    disabled={isPhotoSaving}
                    className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-100 text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password change card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2 select-none">
          <KeyRound className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Security Credentials</h2>
        </div>

        <InlineError error={passwordError} action="submit" className="bg-rose-50 text-rose-600 px-4 py-2.5 rounded-xl text-sm" />

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1 select-none">Current Password</label>
            <input 
              type="password" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-350 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
            />
          </div>
          
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1 select-none">New Password</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-350 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
            />
            {newPassword && (
              <div className="mt-2 space-y-1.5 select-none animate-in slide-in-from-top duration-300">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>Strength: <span className={cn(strength.text === 'Strong' ? 'text-emerald-600' : 'text-slate-650')}>{strength.text}</span></span>
                  <span>{strength.score}/4</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={cn("h-full transition-all duration-300 rounded-full", strength.color)} style={{ width: `${(strength.score / 4) * 100}%` }} />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1 select-none">Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-350 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
            />
          </div>

          <button 
            type="submit" 
            disabled={isPasswordSaving}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-205 flex items-center gap-2 select-none cursor-pointer disabled:opacity-50 animate-in fade-in"
          >
            <Save className="w-4 h-4" /> {isPasswordSaving ? 'Updating...' : 'Change Credentials'}
          </button>
        </form>
      </div>

    </div>
  );
}

function NotificationPreferencesTab({ settings }: { settings: any }) {
  const { showMessage } = useToast();
  const [assessment, setAssessment] = useState(settings.assessmentNotifications);
  const [assignment, setAssignment] = useState(settings.assignmentNotifications);
  const [announcement, setAnnouncement] = useState(settings.announcementNotifications);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (type: 'assessment' | 'assignment' | 'announcement', checked: boolean) => {
    let nextAssessment = assessment;
    let nextAssignment = assignment;
    let nextAnnouncement = announcement;

    if (type === 'assessment') {
      setAssessment(checked);
      nextAssessment = checked;
    } else if (type === 'assignment') {
      setAssignment(checked);
      nextAssignment = checked;
    } else {
      setAnnouncement(checked);
      nextAnnouncement = checked;
    }

    setIsSaving(true);

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('session_token='))?.split('=')[1];
      await fetchJson('/api/student/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          assessmentNotifications: nextAssessment, 
          assignmentNotifications: nextAssignment, 
          announcementNotifications: nextAnnouncement 
        }),
        action: 'submit',
      });
      showMessage('Notification preferences saved successfully.', 'success');
    } catch (err) {
      logDeveloperError(err, { action: 'submit', feature: 'save_notif_settings' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-3 flex items-center gap-2 select-none">
        <Bell className="w-5 h-5 text-teal-600" />
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Notification Preferences</h2>
      </div>

      <div className="space-y-6 max-w-xl select-none animate-in fade-in duration-300">
        <p className="text-xs md:text-sm text-slate-500 font-semibold leading-relaxed">
          Control which notifications and real-time alerts you receive on ExamShala. Toggle options below to customize preferences.
        </p>
        
        <div className="divide-y divide-slate-100">
          
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Assessment Notifications</h4>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Receive alert updates when a new assessment or online test window is assigned to you.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={assessment} onChange={(e) => handleToggle('assessment', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Assignment Notifications</h4>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Receive notices about class assignments, homework tasks, due dates, and evaluation scores.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={assignment} onChange={(e) => handleToggle('assignment', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Announcement Notifications</h4>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Stay informed with generic announcements, platform-wide notices, and system alerts.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={announcement} onChange={(e) => handleToggle('announcement', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

        </div>

      </div>
    </div>
  );
}
