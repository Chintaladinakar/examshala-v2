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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Examshala</h1>
          <h2 className="text-2xl font-semibold text-gray-900">Sign In</h2>
          <p className="text-gray-600 mt-2">Welcome back! Please sign in to continue</p>
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

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors
              ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:underline font-semibold">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}
