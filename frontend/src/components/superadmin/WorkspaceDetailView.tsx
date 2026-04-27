"use client";

import React, { useState } from 'react';
import { X, Users, Shield, GraduationCap, UserCircle, Mail, Plus, Trash2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { User, WorkspaceRole } from '@/types/superadmin';

interface WorkspaceDetailViewProps {
  workspaceName: string;
  isOpen: boolean;
  onClose: () => void;
  members: User[];
  onRemoveMember: (userId: string) => void;
  onAssignRole: (userId: string, role: WorkspaceRole) => void;
}

export function WorkspaceDetailView({ workspaceName, isOpen, onClose, members, onRemoveMember, onAssignRole }: WorkspaceDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'invitations'>('members');

  if (!isOpen) return null;

  const admins = members.filter(m => m.workspaces.some(ws => ws.workspaceName === workspaceName && ws.role === 'admin'));
  const coAdmins = members.filter(m => m.workspaces.some(ws => ws.workspaceName === workspaceName && ws.role === 'coadmin'));
  const teachers = members.filter(m => m.workspaces.some(ws => ws.workspaceName === workspaceName && ws.role === 'teacher'));
  const students = members.filter(m => m.workspaces.some(ws => ws.workspaceName === workspaceName && ws.role === 'student'));

  const RoleSection = ({ title, icon: Icon, users, role }: { title: string, icon: any, users: User[], role: WorkspaceRole }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-lg">
            <Icon className="w-4 h-4 text-slate-600" />
          </div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</h4>
          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{users.length}</span>
        </div>
        <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors flex items-center gap-1">
          Add {title} <Plus className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {users.map(user => (
          <div key={user.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between group hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center font-bold text-xs border border-slate-100">
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">{user.name}</div>
                <div className="text-[10px] text-slate-500 font-medium">{user.email}</div>
              </div>
            </div>
            <button 
              onClick={() => onRemoveMember(user.id)}
              className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {users.length === 0 && (
          <div className="col-span-full py-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
            <p className="text-xs text-slate-400 font-medium italic">No {title.toLowerCase()} assigned yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-[#FBFBFB] shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Workspace Hub</div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{workspaceName}</h2>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <div className="flex gap-8">
            {[
              { id: 'members', label: 'Members', icon: Users },
              { id: 'roles', label: 'Roles & Access', icon: Shield },
              { id: 'invitations', label: 'Invitations', icon: Mail }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 pb-4 text-sm font-black uppercase tracking-widest transition-all relative",
                  activeTab === tab.id ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full animate-in fade-in zoom-in-x duration-300" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto space-y-12">
            {activeTab === 'members' && (
              <div className="space-y-12">
                 <RoleSection title="Workspace Admins" icon={Shield} users={admins} role="admin" />
                 <RoleSection title="Co-Admins" icon={Shield} users={coAdmins} role="coadmin" />
                 <RoleSection title="Teachers" icon={GraduationCap} users={teachers} role="teacher" />
                 <RoleSection title="Students" icon={UserCircle} users={students} role="student" />
              </div>
            )}

            {activeTab === 'roles' && (
              <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-6">
                <h3 className="text-xl font-black text-slate-900">Role Permissions</h3>
                <div className="space-y-4">
                  {[
                    { role: 'Admin', desc: 'Full workspace control, billing, and member management.' },
                    { role: 'Co-Admin', desc: 'Manage assessments, teachers, and students. No access to billing.' },
                    { role: 'Teacher', desc: 'Create tests, assignments, and view student results.' },
                    { role: 'Student', desc: 'Take assessments and view personal performance.' }
                  ].map(r => (
                    <div key={r.role} className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <div className="font-bold text-slate-900">{r.role}</div>
                        <div className="text-xs text-slate-500 mt-1">{r.desc}</div>
                      </div>
                      <button className="text-indigo-600 font-bold text-xs hover:underline">Edit Policy</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'invitations' && (
              <div className="text-center py-20">
                <Mail className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900">No Pending Invitations</h3>
                <p className="text-slate-500 text-sm mt-2 mb-8">Send an invitation link to onboard new members instantly.</p>
                <button className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-sm font-black flex items-center gap-2 mx-auto shadow-xl shadow-indigo-100">
                  <Plus className="w-4 h-4" />
                  Invite Member
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
