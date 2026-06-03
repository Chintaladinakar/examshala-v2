'use client';

import React, { useEffect, useState, useMemo } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import {
  Settings,
  Building2,
  BookOpen,
  Shield,
  Trash2,
  Plus,
  RefreshCw,
  Sliders,
  AlertCircle,
  FileText,
  Search,
  PlusCircle,
  CheckCircle2,
  FolderOpen,
  X
} from 'lucide-react';

type WorkspaceDetails = {
  id: string;
  name: string;
  institutionType: string;
  address: string;
  contactNumber: string;
  email: string;
};

type AcademicSettings = {
  academicYear: string;
  term: string;
  semester: string;
};

type ClassRow = {
  id: string;
  name: string;
  studentCount: number;
  teacherCount: number;
  status: string;
};

type SubjectRow = {
  id: string;
  name: string;
  status: string;
};

type AuditLogRow = {
  id: string;
  action: string;
  user: string;
  email: string;
  date: string;
  module: string;
};

type SettingsData = {
  workspace: WorkspaceDetails;
  academicSettings: AcademicSettings;
  classes: ClassRow[];
  subjects: SubjectRow[];
  auditLogs: AuditLogRow[];
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || 'Server request failed');
  }
  return body.data as T;
}

export default function PrincipalSettingsPage() {
  const { user, loadProfile } = useUser();
  const { showError, showMessage } = useToast();

  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'audit'>('profile');

  // Profile forms
  const [instName, setInstName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Add modals
  const [entityType, setEntityType] = useState<'class' | 'subject'>('class');
  const [entityName, setEntityName] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submittingEntity, setSubmittingEntity] = useState(false);

  // Archive state
  const [archivingClassId, setArchivingClassId] = useState<string | null>(null);

  // Audit Logs Filter
  const [logSearch, setLogSearch] = useState('');
  const [logModuleFilter, setLogModuleFilter] = useState('');

  async function loadSettings() {
    try {
      setLoading(true);
      const res = await apiJson<SettingsData>('/api/principal/settings');
      setData(res);
      setInstName(res.workspace.name);
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isPrincipalMode) {
      loadSettings();
    }
  }, [isPrincipalMode]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName.trim()) return;
    try {
      setSavingProfile(true);
      await apiJson('/api/principal/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'update_workspace',
          workspaceName: instName,
        }),
      });
      showMessage('Institution name updated successfully', 'success');
      loadProfile(); // refresh navbar/sidebar branding
    } catch (err: any) {
      showError(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityName.trim()) return;
    try {
      setSubmittingEntity(true);
      const res = await apiJson<any>('/api/principal/settings', {
        method: 'POST',
        body: JSON.stringify({
          entityType,
          name: entityName,
        }),
      });
      showMessage(`${entityType === 'class' ? 'Class' : 'Subject'} registered successfully`, 'success');
      setAddModalOpen(false);
      setEntityName('');
      loadSettings();
    } catch (err: any) {
      showError(err);
    } finally {
      setSubmittingEntity(false);
    }
  };

  const handleDeleteClass = async (classId: string, name: string) => {
    const confirm = window.confirm(`Are you sure you want to permanently delete Class "${name}"? This action will remove all linked student associations and cannot be undone.`);
    if (!confirm) return;
    try {
      setArchivingClassId(classId);
      await apiJson('/api/principal/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'archive_class',
          classId,
        }),
      });
      showMessage('Class deleted successfully', 'success');
      loadSettings();
    } catch (err: any) {
      showError(err);
    } finally {
      setArchivingClassId(null);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!data) return [];
    return data.auditLogs.filter(log => {
      const matchesSearch =
        log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.user.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.email.toLowerCase().includes(logSearch.toLowerCase());
      const matchesModule = !logModuleFilter || log.module === logModuleFilter;
      return matchesSearch && matchesModule;
    });
  }, [data, logSearch, logModuleFilter]);

  if (!isPrincipalMode) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 p-8 flex flex-col justify-center items-center">
          <div className="bg-white border p-12 rounded-3xl shadow-xl max-w-md text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-black text-slate-800">Access Denied</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              This settings portal is exclusive to Principals.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <DashboardSidebar />

      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto select-none">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Settings className="w-8 h-8 text-teal-800" />
                Admin Settings
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Configure institution profiles, manage academic terms, classes, curriculums, and audit logs.
              </p>
            </div>
            
            <button
              onClick={loadSettings}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-4 py-2 border hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Settings
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Building2 className="w-4 h-4" /> Workspace Profile
            </button>
            
            <button
              onClick={() => setActiveTab('academic')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'academic'
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Classes & Curriculums
            </button>
            
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Shield className="w-4 h-4" /> System Audit Trail
            </button>
          </div>

          {loading && !data ? (
            <div className="bg-white border rounded-3xl p-16 text-center text-xs font-bold text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-teal-800 mx-auto mb-2" />
              Syncing settings database...
            </div>
          ) : data && (
            <div className="space-y-6">
              
              {/* TAB 1: PROFILE */}
              {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Form */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border rounded-3xl p-6 md:p-8 shadow-3xs space-y-6">
                      <div>
                        <h3 className="text-sm font-black text-slate-800">Institution Identity</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Define metadata and profile tags.</p>
                      </div>

                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Institution / Workspace Name *</label>
                          <input
                            type="text"
                            required
                            value={instName}
                            onChange={e => setInstName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Institution Type</label>
                            <input
                              type="text"
                              disabled
                              value={data.workspace.institutionType}
                              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Administrator Email</label>
                            <input
                              type="text"
                              disabled
                              value={data.workspace.email}
                              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Campus Address</label>
                          <input
                            type="text"
                            disabled
                            value={data.workspace.address}
                            className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                          />
                        </div>

                        <div className="pt-4 border-t flex justify-end">
                          <button
                            type="submit"
                            disabled={savingProfile}
                            className="px-5 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl disabled:opacity-50 transition-all cursor-pointer"
                          >
                            {savingProfile ? 'Saving Details...' : 'Save Workspace Details'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Right Academic Terms */}
                  <div className="space-y-6">
                    <div className="bg-white border rounded-3xl p-6 shadow-3xs space-y-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-800">Academic Calendar</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Active curriculum parameters.</p>
                      </div>

                      <div className="space-y-3 bg-slate-50/50 p-4 border rounded-2xl text-xs text-slate-600">
                        <div className="flex justify-between items-center py-1 border-b">
                          <span className="font-semibold text-slate-500">Academic Year</span>
                          <span className="font-extrabold text-slate-800">{data.academicSettings.academicYear}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b">
                          <span className="font-semibold text-slate-500">Active Term</span>
                          <span className="font-extrabold text-slate-800">{data.academicSettings.term}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="font-semibold text-slate-500">Semester Semester</span>
                          <span className="font-extrabold text-slate-800">{data.academicSettings.semester}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: CLASSES & CURRICULUMS */}
              {activeTab === 'academic' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Classes Roster */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border rounded-3xl p-6 shadow-3xs space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <div>
                          <h3 className="text-sm font-black text-slate-800">Grade Classes</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Active grade segments.</p>
                        </div>
                        
                        <button
                          onClick={() => { setEntityType('class'); setAddModalOpen(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[10px] rounded-lg transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Class
                        </button>
                      </div>

                      <div className="divide-y max-h-[50vh] overflow-y-auto pr-1">
                        {data.classes.length === 0 ? (
                          <div className="py-8 text-center text-xs font-bold text-slate-400">No classes mapped.</div>
                        ) : data.classes.map(cls => (
                          <div key={cls.id} className="py-3 flex items-center justify-between text-xs">
                            <div>
                              <h4 className="font-extrabold text-slate-800">{cls.name}</h4>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                Students: {cls.studentCount} • Teachers: {cls.teacherCount}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => handleDeleteClass(cls.id, cls.name)}
                              disabled={archivingClassId === cls.id}
                              className="p-1.5 border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all disabled:opacity-50"
                              title="Delete Class"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Subjects list */}
                  <div className="space-y-6">
                    <div className="bg-white border rounded-3xl p-6 shadow-3xs space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <div>
                          <h3 className="text-sm font-black text-slate-800">Curriculums</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Academic subjects.</p>
                        </div>
                        
                        <button
                          onClick={() => { setEntityType('subject'); setAddModalOpen(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[10px] rounded-lg transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Subject
                        </button>
                      </div>

                      <div className="divide-y max-h-[50vh] overflow-y-auto pr-1">
                        {data.subjects.length === 0 ? (
                          <div className="py-8 text-center text-xs font-bold text-slate-400">No subjects mapped.</div>
                        ) : data.subjects.map(subj => (
                          <div key={subj.id} className="py-3 flex items-center justify-between text-xs">
                            <h4 className="font-extrabold text-slate-800">{subj.name}</h4>
                            <span className="px-2 py-0.5 rounded bg-slate-100 border text-slate-500 font-bold text-[9px] uppercase">
                              {subj.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: AUDIT TRAIL */}
              {activeTab === 'audit' && (
                <div className="space-y-6">
                  
                  {/* Filters bar */}
                  <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 border rounded-2xl shadow-3xs">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search logs by action, actor or email..."
                        value={logSearch}
                        onChange={e => setLogSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={logModuleFilter}
                        onChange={e => setLogModuleFilter(e.target.value)}
                        className="px-3 py-2 border rounded-xl bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none"
                      >
                        <option value="">All Modules</option>
                        <option value="Teachers">Teachers</option>
                        <option value="Students">Students</option>
                        <option value="Attendance">Attendance</option>
                        <option value="Assignments">Assignments</option>
                        <option value="Announcements">Announcements</option>
                        <option value="Evaluations">Evaluations</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                  </div>

                  {/* Audit Logs Table */}
                  <div className="bg-white border rounded-3xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto max-h-[60vh]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider sticky top-0 z-10">
                            <th className="px-6 py-4 bg-slate-50/90">Timestamp</th>
                            <th className="px-6 py-4 bg-slate-50/90">Action</th>
                            <th className="px-6 py-4 bg-slate-50/90">Actor</th>
                            <th className="px-6 py-4 bg-slate-50/90">Audit Module</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredLogs.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-16 text-center">
                                <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs font-extrabold text-slate-500">No logs found</p>
                              </td>
                            </tr>
                          ) : (
                            filteredLogs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-50/50 transition-all text-xs text-slate-700">
                                <td className="px-6 py-4 text-slate-500 font-semibold">
                                  {new Date(log.date).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 font-black text-slate-800">
                                  {log.action}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="space-y-0.5">
                                    <span className="font-extrabold text-slate-750">{log.user}</span>
                                    <span className="block text-[10px] text-slate-400">{log.email}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-100 text-teal-850 text-[10px] font-black uppercase">
                                    {log.module}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      </main>

      {/* ─── ADD CLASS / SUBJECT DIALOG ────────────────────────────────────────── */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden select-none">
            <div className="bg-teal-950 p-6 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-teal-400" /> Create Workspace {entityType === 'class' ? 'Class' : 'Subject'}
                </h3>
                <p className="text-[10px] text-teal-200 mt-0.5">
                  Establishes a new catalog record for workspace curriculum maps.
                </p>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="text-teal-300 hover:text-white transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEntity} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {entityType === 'class' ? 'Class Name' : 'Subject Title'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={entityType === 'class' ? 'e.g. Grade 10B' : 'e.g. Astrophysics'}
                  value={entityName}
                  onChange={e => setEntityName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border hover:bg-slate-50 font-extrabold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEntity}
                  className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submittingEntity ? 'Creating...' : `Create ${entityType === 'class' ? 'Class' : 'Subject'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
