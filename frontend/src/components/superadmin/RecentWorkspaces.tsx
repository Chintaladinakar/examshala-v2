"use client";

import React from 'react';
import { Building2, Users } from 'lucide-react';
import { Table } from './Table';
import { TableRow, TableCell } from './TableRow';

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
  const headers = ["Workspace", "Members"];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="font-black text-slate-900 tracking-tight">Recent Workspaces</h3>
        </div>
      </div>
      
      <Table headers={headers} className="border-none shadow-none rounded-none">
        {workspaces.length > 0 ? (
          workspaces.map((workspace) => (
            <TableRow key={workspace.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{workspace.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium">ID: {workspace.id.slice(0, 8)}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell align="right">
                <div className="flex items-center justify-end gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-xs font-black text-slate-700">{workspace.userCount}</span>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={2} className="py-12 text-center text-slate-400 font-medium">
              No recent workspaces found.
            </TableCell>
          </TableRow>
        )}
      </Table>
    </div>
  );
}
