'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import InputField from '@/components/InputField';
import { decodeJwtPayload, getDashboardPathForRole } from '@/lib/auth';
import { fetchJson } from '@/lib/api';
import InlineError from '@/components/ui/InlineError';
import { logDeveloperError } from '@/lib/error-handler';

type SignInResponse = {
  data: {
    token: string;
    user?: {
      id: string;
      name: string;
      email: string;
      role: string;
      firstLogin?: boolean;
    };
  };
};

export default function SignIn() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await fetchJson<SignInResponse>('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        action: 'login',
      });

      // Redirect if first login
      if (data?.data?.user?.firstLogin) {
        router.push(`/reset-password?email=${encodeURIComponent(formData.email)}&temp=${encodeURIComponent(formData.password)}`);
        return;
      }

      // Store token securely as a browser cookie for middleware and server actions
      document.cookie = `session_token=${data.data.token}; path=/; max-age=86400; SameSite=Lax`;
      
      // Determine correct landing pad
      const decoded = decodeJwtPayload(data.data.token);
      const destination = decoded?.role ? getDashboardPathForRole(decoded.role) : '/';
      
      router.push(destination);
    } catch (err) {
      logDeveloperError(err, { action: 'login', feature: 'signin' });
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans select-none overflow-x-hidden">
      {/* Left Column: Form Card */}
      <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center px-6 py-12 md:px-12 lg:px-16 bg-slate-950 border-r border-slate-900 z-10 relative">
        {/* Background glow decoration */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full mx-auto space-y-8 relative z-10">
          <div className="text-center md:text-left space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <img src="/logo.png" className="w-10 h-10 object-contain" alt="Logo" />
              <span className="font-extrabold text-2xl tracking-tight text-white">EDUsphere</span>
            </Link>
            <div>
              <h2 className="text-2xl font-black text-white">Welcome back</h2>
              <p className="text-slate-450 text-xs font-semibold mt-1">Please sign in to continue to your dashboard</p>
            </div>
          </div>

          <InlineError error={error} action="login" />

          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
              label="Email Address"
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
              required
            />

            <InputField
              label="Password"
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter your password"
              required
            />

            <div className="flex items-center justify-end text-xs -mt-2">
              <Link href="/forgot-password" className="text-teal-400 hover:text-teal-300 font-bold transition-all">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer
                ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center md:text-left text-slate-400 text-xs font-semibold">
            Don't have an account?{' '}
            <Link href="/signup" className="text-teal-400 hover:text-teal-300 font-bold transition-all">
              Sign up here
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column: Hero Banner Image */}
      <div className="hidden md:block md:w-[55%] lg:w-[60%] bg-slate-900 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 opacity-60" />
        <img 
          src="/Gemini_Generated_Image_3xqhfd3xqhfd3xqh main logo.png" 
          className="w-full h-full object-cover opacity-90"
          alt="EDUsphere Platform Banner"
        />
      </div>
    </div>
  );
}
