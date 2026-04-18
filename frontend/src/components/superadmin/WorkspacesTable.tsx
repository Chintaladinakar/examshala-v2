"use client";

import React, { useState } from 'react';
import { Building2, Users, Trash2, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Workspace {
  id: string;
  name: string;
  userCount: number;
  createdAt: string;
  status: string;
}

interface WorkspacesTableProps {
  initialWorkspaces: Workspace[];
  onCreateWorkspace: (name: string) => Promise<any>;
  onDeleteWorkspace: (id: string) => Promise<void>;
}

export function WorkspacesTable({ initialWorkspaces, onCreateWorkspace, onDeleteWorkspace }: WorkspacesTableProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    
    setIsUpdating('creating');
    try {
      const res = await onCreateWorkspace(newWorkspaceName);
      if (res.success) {
        setWorkspaces(prev => [{
            id: res.data.id,
            name: res.data.name,
            userCount: 0,
            createdAt: res.data.createdAt,
            status: 'active'
        }, ...prev]);
        setNewWorkspaceName('');
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to create workspace', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) return;
    
    setIsUpdating(id);
    try {
      await onDeleteWorkspace(id);
      setWorkspaces(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('Failed to delete workspace', error);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Workspace Management</h2>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create Workspace
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-4 animate-in fade-in slide-in-from-top-2">
          <input 
            type="text"
            placeholder="Enter workspace name..."
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            disabled={isUpdating === 'creating'}
            className="flex-1 px-4 py-2 bg-white border border-indigo-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            autoFocus
          />
          <button 
            type="submit"
            disabled={isUpdating === 'creating'}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isUpdating === 'creating' && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm
          </button>
          <button 
            type="button"
            onClick={() => setIsCreating(false)}
            className="text-slate-500 font-medium text-sm hover:text-slate-800"
          >
            Cancel
          </button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Workspace Name</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Members</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created At</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workspaces.map((ws) => (
                <tr key={ws.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5 text-slate-500" />
                      </div>
                      <span className="font-semibold text-slate-800">{ws.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-700">{ws.userCount} Members</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500">
                    {new Date(ws.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-100">
                      {ws.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => handleDelete(ws.id)}
                      disabled={isUpdating === ws.id}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {workspaces.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              No workspaces found. Create your first one to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
