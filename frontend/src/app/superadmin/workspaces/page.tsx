import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { WorkspacesTable } from '@/components/superadmin/WorkspacesTable';

async function getWorkspaces(token: string) {
  const res = await fetch('http://localhost:5000/api/superadmin/workspaces', {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) return [];
  const payload = await res.json();
  return payload.data;
}

async function getMembers(token: string) {
  const res = await fetch('http://localhost:5000/api/superadmin/users', {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) return [];
  const payload = await res.json();
  return payload.data.map((u: any) => ({
    ...u,
    globalRole: u.role === 'superadmin' ? 'superadmin' : 'user',
    workspaces: []
  }));
}

export default async function SuperAdminWorkspacesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    redirect('/signin');
  }

  const [workspaces, members] = await Promise.all([
    getWorkspaces(token),
    getMembers(token)
  ]);

  async function createWorkspace(name: string) {
    'use server';
    const store = await cookies();
    const serverToken = store.get('session_token')?.value;
    
    await fetch('http://localhost:5000/api/superadmin/workspaces', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${serverToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    });
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Workspace Hubs</h1>
        <p className="text-slate-500">Manage organizational units, their memberships, and role assignments.</p>
      </div>

      <WorkspacesTable 
        initialWorkspaces={workspaces} 
        members={members}
        onCreate={createWorkspace} 
        onDelete={deleteWorkspace} 
      />
    </div>
  );
}
