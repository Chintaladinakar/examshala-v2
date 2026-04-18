import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UsersTable } from '@/components/superadmin/UsersTable';

export default async function SuperAdminUsersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    redirect('/signin');
  }

  // Fetch users server-side
  let users = [];
  try {
    const res = await fetch('http://localhost:5000/api/superadmin/users', {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });
    if (res.ok) {
      const payload = await res.json();
      users = payload.data;
    }
  } catch (error) {
    console.error('Failed to fetch users', error);
  }

  // Define Server Actions for interactive elements
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

  async function changeUserRole(userId: string, newRole: string) {
    'use server';
    const store = await cookies();
    const serverToken = store.get('session_token')?.value;
    
    await fetch(`http://localhost:5000/api/superadmin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${serverToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: newRole })
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
        <p className="text-slate-500">Manage all platform users, roles, and account permissions.</p>
      </div>

      <UsersTable 
        initialUsers={users} 
        onToggleStatus={toggleUserStatus} 
        onChangeRole={changeUserRole} 
      />
    </div>
  );
}
