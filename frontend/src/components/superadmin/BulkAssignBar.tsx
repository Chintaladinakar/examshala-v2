"use client";

import React from 'react';
import { UserPlus, Trash2, X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkAssignBarProps {
  selectedCount: number;
  onClear: () => void;
  onAssign: () => void;
  onDelete: () => void;
}

export function BulkAssignBar({ selectedCount, onClear, onAssign, onDelete }: BulkAssignBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-slate-900 text-white rounded-2xl px-6 py-4 flex items-center gap-8 shadow-2xl shadow-slate-900/40 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3 pr-8 border-r border-white/10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight">{selectedCount} Users Selected</div>
            <button onClick={onClear} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">Clear Selection</button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onAssign}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Assign to Workspace
          </button>
          <button 
            onClick={onDelete}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-600/20 transition-all active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            Delete Users
          </button>
        </div>

        <button onClick={onClear} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <X className="w-4 h-4 text-white/40" />
        </button>
      </div>
    </div>
  );
}
