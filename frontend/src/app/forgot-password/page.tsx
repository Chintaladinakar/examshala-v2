'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { fetchJson } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function ForgotPasswordPage() {
  const { showError, showMessage } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devResetLink, setDevResetLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      const res = await fetchJson('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      setSuccess(true);
      showMessage('Password reset request submitted successfully!', 'success');
      
      // Store the link returned in dev mode for easy testing
      if (res?.data?.resetLink) {
        setDevResetLink(res.data.resetLink);
      }
    } catch (err: any) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-[#0f2b2b] to-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1">
            🏫 Examshala
          </span>
          <p className="text-xs text-teal-100/60 font-semibold uppercase tracking-wider">
            Reset Password
          </p>
        </div>

        {success ? (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-white">Reset Link Generated</h2>
              <p className="text-teal-100/60 text-xs leading-relaxed">
                If a user account is associated with <span className="text-white font-bold">{email}</span>, a secure password reset link has been dispatched.
              </p>
            </div>

            {/* Dev Mode Helper to directly test the reset flow */}
            {devResetLink && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Developer Link Helper</span>
                </div>
                <p className="text-[11px] text-teal-100/60 leading-normal">
                  You are in development mode. Click the button below to test the reset password flow directly without configuring real email delivery services:
                </p>
                <Link
                  href={devResetLink}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center"
                >
                  Proceed to Reset Screen
                </Link>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/signin"
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-teal-100 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-teal-100/60 text-xs leading-relaxed text-center">
              Please enter your registered email address below. We will generate a secure reset link to establish a new password credentials.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-teal-200/50 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300/40" />
                <input
                  type="email"
                  required
                  placeholder="name@institution.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-teal-400/50 placeholder-white/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying Email...
                </>
              ) : (
                'Generate Reset Link'
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 text-teal-300/60 hover:text-teal-200 text-xs font-bold transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
