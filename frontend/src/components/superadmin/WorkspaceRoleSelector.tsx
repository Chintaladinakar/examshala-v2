"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { WorkspaceRole } from '@/types/superadmin';

interface WorkspaceRoleSelectorProps {
  value: WorkspaceRole;
  onChange: (role: WorkspaceRole) => void;
  excludePrincipal?: boolean;
  className?: string;
}

export function WorkspaceRoleSelector({ value, onChange, excludePrincipal = false, className }: WorkspaceRoleSelectorProps) {
  const roles: { value: WorkspaceRole; label: string; description: string }[] = [
    { value: 'admin', label: 'Admin', description: 'Full access to workspace settings and members.' },
    { value: 'coadmin', label: 'Co-Admin', description: 'Can manage members and assessments.' },
    { value: 'principal', label: 'Principal', description: 'Academic lead with special oversight.' },
    { value: 'teacher', label: 'Teacher', description: 'Can create and grade assessments.' },
    { value: 'student', label: 'Student', description: 'Can view and take assessments.' },
  ];

  const filteredRoles = excludePrincipal ? roles.filter(r => r.value !== 'principal') : roles;

  return (
    <div className={cn("grid grid-cols-1 gap-2", className)}>
      {filteredRoles.map((role) => (
        <button
          key={role.value}
          type="button"
          onClick={() => onChange(role.value)}
          className={cn(
            "flex flex-col items-start p-3 rounded-xl border text-left transition-all",
            value === role.value
              ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10"
              : "bg-white border-slate-100 hover:border-slate-200"
          )}
        >
          <div className="flex items-center justify-between w-full">
            <span className={cn(
              "text-sm font-bold",
              value === role.value ? "text-indigo-900" : "text-slate-900"
            )}>
              {role.label}
            </span>
            {value === role.value && (
              <div className="w-2 h-2 rounded-full bg-indigo-600" />
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{role.description}</p>
        </button>
      ))}
    </div>
  );
}
