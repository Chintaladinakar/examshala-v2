"use client";

import React from 'react';
import { Building2, Users } from 'lucide-react';

interface RecentWorkspace {
  id: string;
  name: string;
  userCount: number;
  createdAt: string;
}

interface RecentWorkspacesProps {
  workspaces: RecentWorkspace[];
}

export function RecentWorkspaces({ workspaces }: RecentWorkspacesProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-slate-100 flex items-center gap-2">
        <Building2 className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-800">Recent Workspaces</h3>
      </div>
      <div className="flex-1">
        {workspaces.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{workspace.name}</h4>
                    <p className="text-xs text-slate-400">Created {new Date(workspace.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-100">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">{workspace.userCount}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-sm">
            No recent workspaces found.
          </div>
        )}
      </div>
    </div>
  );
}
