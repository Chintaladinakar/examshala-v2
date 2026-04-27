"use client";

import React, { useState, useMemo } from 'react';
import { ShieldAlert, CheckCircle, UserPlus, Building2, ShieldCheck, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchBar } from './SearchBar';
import { FilterDropdown } from './FilterDropdown';
import { Table } from './Table';
import { TableRow, TableCell } from './TableRow';
import { BulkAssignBar } from './BulkAssignBar';
import { AssignUserModal } from './AssignUserModal';
import { User, Workspace, WorkspaceRole } from '@/types/superadmin';

interface UsersTableProps {
  initialUsers: User[];
  workspaces: Workspace[];
  onToggleStatus: (userId: string, currentStatus: boolean) => Promise<void>;
  onBulkAssign: (userIds: string[], workspaceId: string, role: WorkspaceRole) => Promise<void>;
}

export function UsersTable({ initialUsers, workspaces, onToggleStatus, onBulkAssign }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.globalRole === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const toggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const handleBulkAssign = async (workspaceId: string, role: WorkspaceRole) => {
    const idsToAssign = assigningUserId ? [assigningUserId] : selectedUserIds;
    await onBulkAssign(idsToAssign, workspaceId, role);
    
    // Optimistic UI update (optional, but good for "frontend only" feel)
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace) {
      setUsers(prev => prev.map(u => {
        if (idsToAssign.includes(u.id)) {
          const existing = u.workspaces.filter(ws => ws.workspaceId !== workspaceId);
          return {
            ...u,
            workspaces: [...existing, { workspaceId, workspaceName: workspace.name, role }]
          };
        }
        return u;
      }));
    }
    
    setSelectedUserIds([]);
    setAssigningUserId(null);
  };

  const roleOptions = [
    { label: 'All Users', value: 'all' },
    { label: 'Super Admins', value: 'superadmin' },
    { label: 'Regular Users', value: 'user' },
  ];

  const headers = [
    <input type="checkbox" checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0} onChange={toggleSelectAll} className="rounded border-slate-300" />,
    "User Details", 
    "Workspaces & Roles", 
    "Status", 
    "Joined", 
    "Actions"
  ];

  const selectedUserNames = users
    .filter(u => (assigningUserId ? u.id === assigningUserId : selectedUserIds.includes(u.id)))
    .map(u => u.name);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <SearchBar 
          value={searchTerm} 
          onChange={setSearchTerm} 
          placeholder="Search by name or email..." 
        />
        <FilterDropdown 
          label="Global Role" 
          options={roleOptions} 
          value={roleFilter} 
          onChange={setRoleFilter} 
        />
      </div>

      <Table headers={headers}>
        {filteredUsers.map((user) => (
          <TableRow key={user.id} className={cn(selectedUserIds.includes(user.id) && "bg-indigo-50/30")}>
            <TableCell>
              <input 
                type="checkbox" 
                checked={selectedUserIds.includes(user.id)} 
                onChange={() => toggleSelectUser(user.id)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs border border-slate-200">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{user.name}</span>
                    {user.globalRole === 'superadmin' && (
                       <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-tighter rounded-md">Super</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1.5 max-w-xs">
                {user.workspaces.length > 0 ? (
                  user.workspaces.map((ws, i) => (
                    <div key={i} className="group relative">
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-all",
                        ws.role === 'admin' ? "bg-slate-900 text-white border-slate-900" :
                        ws.role === 'coadmin' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                        ws.role === 'principal' ? "bg-amber-50 text-amber-700 border-amber-100" :
                        "bg-slate-50 text-slate-600 border-slate-100"
                      )}>
                        <span>{ws.workspaceName}</span>
                        <span className="opacity-40 font-black">/</span>
                        <span className="uppercase tracking-tighter">{ws.role}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold italic tracking-tight">No hubs assigned</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                user.isActive 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                  : "bg-rose-50 text-rose-700 border border-rose-100"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", user.isActive ? "bg-emerald-500" : "bg-rose-500")} />
                {user.isActive ? 'Active' : 'Disabled'}
              </span>
            </TableCell>
            <TableCell className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </TableCell>
            <TableCell align="right">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setAssigningUserId(user.id);
                    setIsAssignModalOpen(true);
                  }}
                  className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 active:scale-95"
                  title="Assign to Workspace"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onToggleStatus(user.id, user.isActive)}
                  className={cn(
                    "p-2.5 rounded-xl transition-all border shadow-sm active:scale-95",
                    user.isActive 
                    ? "text-rose-600 border-rose-100 hover:bg-rose-50 hover:shadow-rose-100" 
                    : "text-emerald-600 border-emerald-100 hover:bg-emerald-50 hover:shadow-emerald-100"
                  )}
                >
                  {user.isActive ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>

      <BulkAssignBar 
        selectedCount={selectedUserIds.length} 
        onClear={() => setSelectedUserIds([])}
        onAssign={() => setIsAssignModalOpen(true)}
        onDelete={() => confirm('Delete selected users?')}
      />

      <AssignUserModal 
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssigningUserId(null);
        }}
        onAssign={handleBulkAssign}
        workspaces={workspaces}
        userNames={selectedUserNames}
      />

      {filteredUsers.length === 0 && (
        <div className="p-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
           <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
           <h3 className="text-lg font-bold text-slate-900">No users match your criteria</h3>
           <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search term.</p>
        </div>
      )}
    </div>
  );
}
