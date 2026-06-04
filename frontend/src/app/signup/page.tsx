'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import InputField from '@/components/InputField';
import { fetchJson } from '@/lib/api';
import InlineError from '@/components/ui/InlineError';
import { logDeveloperError } from '@/lib/error-handler';
import { decodeJwtPayload, getDashboardPathForRole } from '@/lib/auth';

function getTokenFromSignupResponse(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const rec = body as Record<string, unknown>;
  if (typeof rec.token === 'string') return rec.token;
  const data = rec.data;
  if (data && typeof data === 'object') {
    const token = (data as Record<string, unknown>).token;
    if (typeof token === 'string') return token;
  }
  return null;
}

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await fetchJson('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        action: 'signup',
      });

      // Store token on successful signin/signup
      const token = getTokenFromSignupResponse(data);
      if (token) {
        localStorage.setItem('token', token);
        // Set the session cookie for Next.js middleware protection
        document.cookie = `session_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        
        // Determine correct landing pad and route directly
        const decoded = decodeJwtPayload(token);
        const destination = decoded?.role ? getDashboardPathForRole(decoded.role) : '/';
        router.push(destination);
      } else {
        router.push('/signin');
      }
    } catch (err) {
      logDeveloperError(err, { action: 'signup', feature: 'signup' });
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

        <div className="max-w-md w-full mx-auto space-y-6 relative z-10">
          <div className="text-center md:text-left space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <img src="/logo.png" className="w-10 h-10 object-contain" alt="Logo" />
              <span className="font-extrabold text-2xl tracking-tight text-white">EDUsphere</span>
            </Link>
            <div>
              <h2 className="text-2xl font-black text-white">Create account</h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">Join the leading multi-tenant digital examination sphere</p>
            </div>
          </div>

          <InlineError error={error} action="signup" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Full Name"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
              required
            />

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
              placeholder="Create a password"
              required
            />

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">I am a...</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white text-xs font-bold transition-all">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={formData.role === 'student'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-4 h-4 text-teal-600 border-slate-700 bg-slate-900 focus:ring-teal-500 focus:ring-offset-slate-950"
                  />
                  <span>Student</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white text-xs font-bold transition-all">
                  <input
                    type="radio"
                    name="role"
                    value="tutor"
                    checked={formData.role === 'tutor'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-4 h-4 text-teal-600 border-slate-700 bg-slate-900 focus:ring-teal-500 focus:ring-offset-slate-950"
                  />
                  <span>Tutor</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4
                ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center md:text-left text-slate-400 text-xs font-semibold">
            Already have an account?{' '}
            <Link href="/signin" className="text-teal-400 hover:text-teal-300 font-bold transition-all">
              Sign in here
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
