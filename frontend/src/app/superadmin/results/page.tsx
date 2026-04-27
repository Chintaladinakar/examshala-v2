import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ResultsTable } from '@/components/superadmin/ResultsTable';

export default async function SuperAdminResultsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    redirect('/signin');
  }

  // Fetch all results server-side
  let resultsData = [];
  try {
    const res = await fetch('http://localhost:5000/api/superadmin/results', {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });
    if (res.ok) {
      const payload = await res.json();
      resultsData = payload.data;
    }
  } catch (error) {
    console.error('Failed to fetch results', error);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Performance</h1>
        <p className="text-slate-500">Global monitoring of all assessment attempts and student results.</p>
      </div>

      <ResultsTable initialResults={resultsData} />
    </div>
  );
}
