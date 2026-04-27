"use client";

import React, { useState } from 'react';
import { X, Building2, ShieldCheck, Loader2 } from 'lucide-react';
import { WorkspaceRoleSelector } from './WorkspaceRoleSelector';
import { WorkspaceRole, Workspace } from '@/types/superadmin';
import { cn } from '@/lib/utils';

interface AssignUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (workspaceId: string, role: WorkspaceRole) => Promise<void>;
  workspaces: Workspace[];
  userNames: string[]; // Support for multiple users (bulk)
}

export function AssignUserModal({ isOpen, onClose, onAssign, workspaces, userNames }: AssignUserModalProps) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [selectedRole, setSelectedRole] = useState<WorkspaceRole>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceId) return;
    setIsSubmitting(true);
    try {
      await onAssign(selectedWorkspaceId, selectedRole);
      onClose();
    } catch (error) {
      console.error('Failed to assign user', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Assign to Workspace</h3>
              <p className="text-xs text-slate-500 font-medium">Assign {userNames.length} user{userNames.length > 1 ? 's' : ''} to a hub.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Selected Users Preview */}
            <div className="flex flex-wrap gap-2">
              {userNames.map((name, i) => (
                <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100">
                  {name}
                </span>
              ))}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1">Target Workspace</label>
              <select
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Select a workspace...</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1">Workspace Role</label>
              <WorkspaceRoleSelector 
                value={selectedRole} 
                onChange={setSelectedRole}
                excludePrincipal={false} // Super admin context
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Workspace specific</span>
            </div>
            <div className="flex gap-3">
               <button 
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting || !selectedWorkspaceId}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl text-sm font-black flex items-center gap-2 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                Assign Now
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
