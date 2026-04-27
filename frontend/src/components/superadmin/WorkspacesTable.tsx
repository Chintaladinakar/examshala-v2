"use client";

import React, { useState, useMemo } from 'react';
import { Building2, Search, Trash2, ArrowRight, ArrowUpDown, Calendar, Users, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table } from './Table';
import { TableRow, TableCell } from './TableRow';
import { SearchBar } from './SearchBar';
import { FilterDropdown } from './FilterDropdown';
import { WorkspaceDetailView } from './WorkspaceDetailView';
import { Workspace, User } from '@/types/superadmin';

interface WorkspacesTableProps {
  initialWorkspaces: Workspace[];
  members: User[];
  onCreate: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function WorkspacesTable({ initialWorkspaces, members, onCreate, onDelete }: WorkspacesTableProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

  const filteredWorkspaces = useMemo(() => {
    let result = workspaces.filter(ws => 
      ws.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'members') {
      result.sort((a, b) => b.userCount - a.userCount);
    }

    return result;
  }, [workspaces, searchTerm, sortBy]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onCreate(newWorkspaceName);
      // Optimistic update for UI feedback
      const newWs: Workspace = {
        id: Math.random().toString(36).substr(2, 9),
        name: newWorkspaceName,
        userCount: 0,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      setWorkspaces(prev => [newWs, ...prev]);
      setNewWorkspaceName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create workspace', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Most Members', value: 'members' },
  ];

  const headers = ["Workspace Name", "Members", "Created At", "Status", "Actions"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 items-center w-full">
          <SearchBar 
            value={searchTerm} 
            onChange={setSearchTerm} 
            placeholder="Search workspaces..." 
          />
          <FilterDropdown 
            label="Sort by" 
            options={sortOptions} 
            value={sortBy} 
            onChange={setSortBy} 
          />
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Create Hub
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white border border-indigo-100 rounded-2xl p-6 flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex-1">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">New Hub Name</label>
            <input 
              type="text"
              placeholder="e.g. Engineering, Design..."
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              autoFocus
            />
          </div>
          <div className="flex items-end gap-3">
            <button 
              type="submit"
              disabled={isSubmitting || !newWorkspaceName.trim()}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-black hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-md shadow-indigo-100"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
            <button 
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-slate-500 font-bold text-sm hover:text-slate-800 px-4 py-3 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <Table headers={headers}>
        {filteredWorkspaces.map((ws) => (
          <TableRow key={ws.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all duration-300">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base">{ws.name}</div>
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">ID: {ws.id.slice(0, 8)}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-300">
                      ?
                    </div>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-600">+{ws.userCount}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-tight">
                <Calendar className="w-3.5 h-3.5 text-slate-300" />
                {new Date(ws.createdAt).toLocaleDateString()}
              </div>
            </TableCell>
            <TableCell>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-100">
                {ws.status}
              </span>
            </TableCell>
            <TableCell align="right">
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedWorkspace(ws)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95"
                >
                  Manage <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => onDelete(ws.id)}
                  className="p-2.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  title="Delete Hub"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Table>

      {selectedWorkspace && (
        <WorkspaceDetailView 
          isOpen={!!selectedWorkspace}
          onClose={() => setSelectedWorkspace(null)}
          workspaceName={selectedWorkspace.name}
          members={members}
          onRemoveMember={(uid) => console.log('Remove member', uid)}
          onAssignRole={(uid, role) => console.log('Assign role', uid, role)}
        />
      )}

      {filteredWorkspaces.length === 0 && (
        <div className="p-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
           <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
           <h3 className="text-lg font-bold text-slate-900">No workspaces found</h3>
           <p className="text-slate-500 text-sm mt-1">Try adjusting your search or create a new hub.</p>
        </div>
      )}
    </div>
  );
}
