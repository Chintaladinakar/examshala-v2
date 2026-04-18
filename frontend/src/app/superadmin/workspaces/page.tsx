import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { WorkspacesTable } from '@/components/superadmin/WorkspacesTable';

export default async function SuperAdminWorkspacesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    redirect('/signin');
  }

  // Fetch workspaces server-side
  let workspaces = [];
  try {
    const res = await fetch('http://localhost:5000/api/superadmin/workspaces', {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });
    if (res.ok) {
      const payload = await res.json();
      workspaces = payload.data;
    }
  } catch (error) {
    console.error('Failed to fetch workspaces', error);
  }

  // Server Actions
  async function createWorkspace(name: string) {
    'use server';
    const store = await cookies();
    const serverToken = store.get('session_token')?.value;
    
    const res = await fetch('http://localhost:5000/api/superadmin/workspaces', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${serverToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    });
    return res.json();
  }

  async function deleteWorkspace(id: string) {
    'use server';
    const store = await cookies();
    const serverToken = store.get('session_token')?.value;
    
    await fetch(`http://localhost:5000/api/superadmin/workspaces/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${serverToken}` }
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Workspaces</h1>
        <p className="text-slate-500">Monitor all institute hubs and bootcamp environments across the platform.</p>
      </div>

      <WorkspacesTable 
        initialWorkspaces={workspaces} 
        onCreateWorkspace={createWorkspace} 
        onDeleteWorkspace={deleteWorkspace} 
      />
    </div>
  );
}
