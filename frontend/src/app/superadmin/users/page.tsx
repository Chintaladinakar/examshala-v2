import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UsersTable } from '@/components/superadmin/UsersTable';

async function getUsers(token: string) {
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

async function getWorkspaces(token: string) {
  const res = await fetch('http://localhost:5000/api/superadmin/workspaces', {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store'
  });
  if (!res.ok) return [];
  const payload = await res.json();
  return payload.data;
}

export default async function SuperAdminUsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) redirect('/signin');

  const [users, workspaces] = await Promise.all([
    getUsers(token),
    getWorkspaces(token)
  ]);

  async function toggleUserStatus(userId: string, currentStatus: boolean) {
    'use server';
    const store = await cookies();
    const serverToken = store.get('session_token')?.value;
    
    await fetch(`http://localhost:5000/api/superadmin/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${serverToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isActive: !currentStatus })
    });
  }

  async function bulkAssign(userIds: string[], workspaceId: string, role: string) {
    'use server';
    console.log('Bulk Assign (Frontend Only):', userIds, workspaceId, role);
    // Placeholder for real backend logic
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Global Users</h1>
          <p className="text-slate-500">Manage all platform users and their hub assignments.</p>
        </div>
      </div>

      <UsersTable 
        initialUsers={users} 
        workspaces={workspaces}
        onToggleStatus={toggleUserStatus} 
        onBulkAssign={bulkAssign}
      />
    </div>
  );
}
