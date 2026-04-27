"use client";

import React from 'react';
import { User, Calendar } from 'lucide-react';
import { Table } from './Table';
import { TableRow, TableCell } from './TableRow';

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface RecentUsersProps {
  users: RecentUser[];
}

export function RecentUsers({ users }: RecentUsersProps) {
  const headers = ["User", "Joined"];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <User className="w-5 h-5" />
          </div>
          <h3 className="font-black text-slate-900 tracking-tight">Recent Users</h3>
        </div>
      </div>
      
      <Table headers={headers} className="border-none shadow-none rounded-none">
        {users.length > 0 ? (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{user.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{user.role}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell align="right" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={2} className="py-12 text-center text-slate-400 font-medium">
              No recent users found.
            </TableCell>
          </TableRow>
        )}
      </Table>
    </div>
  );
}
