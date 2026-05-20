import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { WorkspacesTable } from '@/components/superadmin/WorkspacesTable';
import { fetchJson } from '@/lib/api';
import { getSuperAdminWorkspaces, getSuperAdminUsers } from '@/lib/superadmin/data';

export default async function SuperAdminWorkspacesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    redirect('/signin');
  }

  const [workspaces, members] = await Promise.all([
    getSuperAdminWorkspaces(token),
    getSuperAdminUsers(token),
  ]);

  async function createWorkspace(name: string) {
    'use server';
    const store = await cookies();
    const serverToken = store.get('session_token')?.value;
    
    await fetchJson('/api/superadmin/workspaces', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${serverToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      action: 'create',
    });
  }

  async function deleteWorkspace(id: string) {
    'use server';
    const store = await cookies();
    const serverToken = store.get('session_token')?.value;
    
    await fetchJson(`/api/superadmin/workspaces/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${serverToken}` },
      action: 'delete',
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
