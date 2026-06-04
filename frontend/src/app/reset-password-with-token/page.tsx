'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldAlert, Lock, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
import { fetchJson } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import Link from 'next/link';

type ResetResponse = {
  success: boolean;
  message?: string;
};

function ResetPasswordWithTokenForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showMessage } = useToast();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token') || '';
    setToken(tokenParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showMessage('Password reset token is missing', 'error');
      return;
    }

    if (!newPassword || !confirmPassword) return;

    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return;
    }

    try {
      setLoading(true);
      await fetchJson<ResetResponse>('/api/auth/reset-password-with-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: newPassword,
        }),
      });

      setSuccess(true);
      showMessage('Password updated successfully! Redirecting to Sign In...', 'success');

      setTimeout(() => {
        router.push('/signin');
      }, 1500);
    } catch (err: any) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  if (!token && !loading) {
    return (
      <div className="space-y-5 text-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-200 text-xs leading-relaxed flex gap-3 items-start justify-center">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-left">
            <span className="font-bold block">Invalid Reset Session</span>
            The password reset token is missing from the URL. Please verify your link or generate a new request.
          </div>
        </div>
        <div className="pt-2">
          <Link
            href="/forgot-password"
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-teal-100 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Password Reset!</h2>
        <p className="text-teal-100/60 text-xs">
          Your credentials have been updated successfully. Redirecting you to the sign-in screen...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-emerald-200 text-xs leading-relaxed flex gap-3 items-start">
        <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block">Establish New Password</span>
          Please set your new account password. This link is single-use only and will expire in 1 hour.
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-teal-200/50 uppercase tracking-wide">
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300/40" />
          <input
            type="password"
            required
            placeholder="Min. 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-teal-400/50 placeholder-white/20"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-teal-200/50 uppercase tracking-wide">
          Confirm New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300/40" />
          <input
            type="password"
            required
            placeholder="Verify passwords match"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-teal-400/50 placeholder-white/20"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating Credentials...
          </>
        ) : (
          'Update Password'
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordWithTokenPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-[#0f2b2b] to-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <span className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1">
            🏫 EDUsphere
          </span>
          <p className="text-xs text-teal-100/60 font-semibold uppercase tracking-wider">
            Establish Credentials
          </p>
        </div>

        <Suspense fallback={
          <div className="py-12 text-center text-teal-200/50 text-xs font-bold space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-400 mx-auto" />
            <span>Initializing secure context...</span>
          </div>
        }>
          <ResetPasswordWithTokenForm />
        </Suspense>
      </div>
    </div>
  );
}
