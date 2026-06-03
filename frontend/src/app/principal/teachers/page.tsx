'use client';

import React, { useEffect, useState, useMemo } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Sliders,
  CheckCircle,
  XCircle,
  Briefcase,
  BookOpen,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  X,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

type ClassLite = { id: string; name: string };
type Teacher = {
  id: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  experience: string;
  subjects: string[];
  classes: ClassLite[];
  assignmentsCreated: number;
  examsCreated: number;
  isActive: boolean;
  status: string;
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
    throw new Error(body?.error?.message || 'Server operation failed');
  }
  return body.data as T;
}

export default function PrincipalTeachersPage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();

  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals & Drawers
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [assignmentDrawerOpen, setAssignmentDrawerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Selected targets
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Forms state
  const [formName, setFormName] = useState('');
  const [addMode, setAddMode] = useState<'create' | 'associate'>('create');
  const [formUniqueId, setFormUniqueId] = useState('');
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formQualification, setFormQualification] = useState('');
  const [formExperience, setFormExperience] = useState('');
  const [formSubjects, setFormSubjects] = useState<string[]>([]);
  const [formClassIds, setFormClassIds] = useState<string[]>([]);
  
  const [submitting, setSubmitting] = useState(false);

  // Search subjects checklist
  const [subjectSearch, setSubjectSearch] = useState('');
  const [classSearch, setClassSearch] = useState('');

  const defaultSubjects = ['Mathematics', 'Science', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Social Studies'];

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.qualification.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teachers, searchQuery]);

  async function loadData() {
    try {
      setLoading(true);
      const [teachersData, classesData] = await Promise.all([
        apiJson<Teacher[]>('/api/principal/teachers'),
        apiJson<any[]>('/api/classes'),
      ]);
      setTeachers(teachersData);
      setClasses(classesData.map(c => ({ id: c.id, name: c.name })));
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isPrincipalMode) {
      loadData();
    }
  }, [isPrincipalMode]);

  const handleToggleStatus = async (teacher: Teacher) => {
    try {
      const nextActive = !teacher.isActive;
      const res = await apiJson<any>('/api/principal/teachers/update', {
        method: 'PATCH',
        body: JSON.stringify({
          teacherId: teacher.id,
          action: 'toggle_status',
          isActive: nextActive
        })
      });
      setTeachers(prev => prev.map(t => t.id === teacher.id ? { ...t, isActive: res.isActive, status: res.status } : t));
      showMessage(`Teacher account ${nextActive ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (e: any) {
      showError(e);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      const payload = addMode === 'associate'
        ? {
            mode: 'associate',
            uniqueId: formUniqueId,
            classIds: formClassIds,
            subjects: formSubjects
          }
        : {
            mode: 'create',
            name: formName,
            email: formEmail,
            phone: formPhone,
            qualification: formQualification,
            experience: formExperience,
            subjects: formSubjects,
            classIds: formClassIds
          };

      const res = await apiJson<any>('/api/principal/teachers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      showMessage(addMode === 'associate' ? 'Teacher associated' : 'Teacher created', 'success');
      loadData();

      if (addMode === 'create' && res.generatedPassword) {
        setCreatedPassword(res.generatedPassword);
      } else {
        setAddModalOpen(false);
        resetForm();
      }
    } catch (e: any) {
      showError(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    try {
      setSubmitting(true);
      const res = await apiJson<any>('/api/principal/teachers/update', {
        method: 'PATCH',
        body: JSON.stringify({
          teacherId: selectedTeacher.id,
          action: 'update_profile',
          name: formName,
          email: formEmail,
          phone: formPhone,
          qualification: formQualification,
          experience: formExperience,
          subjects: formSubjects
        })
      });
      setTeachers(prev => prev.map(t => t.id === selectedTeacher.id ? { ...t, ...res } : t));
      showMessage('Teacher profile updated successfully', 'success');
      setEditModalOpen(false);
      resetForm();
    } catch (e: any) {
      showError(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAssignments = async () => {
    if (!selectedTeacher) return;
    try {
      setSubmitting(true);
      const res = await apiJson<any>('/api/principal/teachers/update', {
        method: 'PATCH',
        body: JSON.stringify({
          teacherId: selectedTeacher.id,
          action: 'assign_classes_subjects',
          classIds: formClassIds,
          subjects: formSubjects
        })
      });
      setTeachers(prev => prev.map(t => t.id === selectedTeacher.id ? { ...t, classes: res.classes, subjects: formSubjects } : t));
      showMessage('Assigned classes and subjects successfully updated', 'success');
      setAssignmentDrawerOpen(false);
      resetForm();
    } catch (e: any) {
      showError(e);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormQualification('');
    setFormExperience('');
    setFormSubjects([]);
    setFormClassIds([]);
    setFormUniqueId('');
    setCreatedPassword(null);
    setSelectedTeacher(null);
  };

  const openAddModal = () => {
    resetForm();
    setAddModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormName(teacher.name);
    setFormEmail(teacher.email);
    setFormPhone(teacher.phone);
    setFormQualification(teacher.qualification);
    setFormExperience(teacher.experience);
    setFormSubjects(teacher.subjects);
    setFormClassIds(teacher.classes.map(c => c.id));
    setEditModalOpen(true);
  };

  const openAssignmentDrawer = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormSubjects(teacher.subjects);
    setFormClassIds(teacher.classes.map(c => c.id));
    setAssignmentDrawerOpen(true);
  };

  const openProfileDrawer = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setProfileDrawerOpen(true);
  };

  if (!isPrincipalMode) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 p-8 flex flex-col justify-center items-center">
          <div className="bg-white border p-12 rounded-3xl shadow-xl max-w-md text-center space-y-4">
            <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-black text-slate-800">Access Denied</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              This dashboard is exclusive to Principals in Principal Mode. Please toggle your role from the sidebar.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <DashboardSidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto select-none">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-8 h-8 text-teal-800" />
                Teacher Management
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Register faculty, assign curriculums, and audit instructor workloads workspace-wide.
              </p>
            </div>
            
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Add Teacher Account
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 border rounded-2xl shadow-3xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search teacher by name, email, or qualification..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-700/35 transition-all"
              />
            </div>
            
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3.5 py-2 border hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {/* Directory Roster */}
          <div className="bg-white border rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                    <th className="px-6 py-4">Instructor</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Assigned Scope</th>
                    <th className="px-6 py-4">Assignments / Exams</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-xs font-bold text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-teal-800" />
                          <span>Syncing teacher registry...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-extrabold text-slate-500">No teachers found</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Try searching with a different keyword.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map(t => {
                      const initials = t.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-all text-xs text-slate-700">
                          {/* Profile & Name */}
                          <td className="px-6 py-4 font-semibold">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-700 to-teal-900 border border-teal-800/15 flex items-center justify-center font-bold text-white text-[11px] uppercase tracking-wider shrink-0 shadow-inner">
                                {initials}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-800 leading-snug">{t.name}</h4>
                                <span className="text-[9px] text-slate-400 font-extrabold uppercase bg-slate-100 border px-1.5 py-0.5 rounded mt-1 inline-block">
                                  {t.qualification || 'Faculty'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[150px]">{t.email}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{t.phone || '—'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Scope */}
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-100">
                                🏫 {t.classes.length} Classes
                              </span>
                              <span className="block text-[10px] text-slate-400 font-bold">
                                📚 {t.subjects.length} Subjects Assigned
                              </span>
                            </div>
                          </td>

                          {/* Engagement Counts */}
                          <td className="px-6 py-4">
                            <div className="space-y-1 text-[10px] font-semibold text-slate-500">
                              <div>Created Assignments: <span className="font-black text-slate-800">{t.assignmentsCreated}</span></div>
                              <div>Assigned Exams: <span className="font-black text-slate-800">{t.examsCreated}</span></div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleStatus(t)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border cursor-pointer select-none transition-all ${
                                t.isActive
                                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-rose-500/10 hover:text-rose-700 hover:border-rose-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-500/10 hover:text-emerald-700 hover:border-emerald-200'
                              }`}
                              title={t.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              {t.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openProfileDrawer(t)}
                                className="px-2.5 py-1.5 border hover:bg-slate-100 text-slate-600 font-bold text-[10px] rounded-lg transition-all"
                              >
                                Profile
                              </button>
                              <button
                                onClick={() => openAssignmentDrawer(t)}
                                className="px-2.5 py-1.5 border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[10px] rounded-lg transition-all"
                              >
                                Assign Scope
                              </button>
                              <button
                                onClick={() => openEditModal(t)}
                                className="p-1.5 border hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-all"
                                title="Edit Profile Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* ─── ADD TEACHER MODAL ─────────────────────────────────────────────────── */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in">
          {createdPassword ? (
            <div className="bg-white w-full max-w-md rounded-2xl border shadow-xl p-6 space-y-4 text-center select-none animate-fade-in">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl">
                🎉
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-black text-slate-800">Teacher Account Created!</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Save login credentials</p>
              </div>
              <div className="bg-slate-50 border p-4 rounded-xl space-y-2 text-left text-xs font-semibold">
                <div>
                  <span className="text-[9px] text-slate-400 block font-extrabold uppercase tracking-wide">Email Address</span>
                  <span className="text-slate-700">{formEmail}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-extrabold uppercase tracking-wide">Temporary Password</span>
                  <span className="text-slate-800 font-mono text-sm tracking-wider font-extrabold">{createdPassword}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`Email: ${formEmail}\nPassword: ${createdPassword}`);
                    showMessage('Credentials copied to clipboard!', 'success');
                  }}
                  className="flex-1 px-4 py-2 border rounded-xl hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
                >
                  📋 Copy Details
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedPassword(null);
                    setAddModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transform transition-all select-none">
              <div className="bg-teal-950 p-6 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Add Faculty Instructor
                  </h3>
                  <p className="text-[10px] text-teal-200 mt-0.5 font-semibold">Register and initialize teacher/tutor workspace settings.</p>
                </div>
                <button onClick={() => { setAddModalOpen(false); resetForm(); }} className="text-teal-300 hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Switcher */}
              <div className="px-6 pt-4">
                <div className="flex rounded-xl bg-slate-100 p-0.5 border text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAddMode('create')}
                    className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-all ${addMode === 'create' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
                  >
                    Create New Teacher
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode('associate')}
                    className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-all ${addMode === 'associate' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
                  >
                    Associate Existing
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleCreateTeacher} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {addMode === 'create' ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={e => setFormName(e.target.value)}
                          placeholder="e.g. Prof. Rakesh Sharma"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email Address *</label>
                        <input
                          type="email"
                          required
                          value={formEmail}
                          onChange={e => setFormEmail(e.target.value)}
                          placeholder="e.g. rakesh@school.com"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Phone Number</label>
                        <input
                          type="text"
                          value={formPhone}
                          onChange={e => setFormPhone(e.target.value)}
                          placeholder="e.g. +91 99999 88888"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Qualifications</label>
                        <input
                          type="text"
                          value={formQualification}
                          onChange={e => setFormQualification(e.target.value)}
                          placeholder="e.g. M.Sc, Ph.D in Physics"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Experience (Years)</label>
                      <input
                        type="text"
                        value={formExperience}
                        onChange={e => setFormExperience(e.target.value)}
                        placeholder="e.g. 5+ Years"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Unique Identifier (Email, Username, or ID) *</label>
                    <input
                      type="text"
                      required
                      value={formUniqueId}
                      onChange={e => setFormUniqueId(e.target.value)}
                      placeholder="Enter unique ID or email"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                )}

                {/* Class Search Assignments */}
                <div className="border rounded-2xl p-4 bg-slate-50/70 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Assign Grade Classes</span>
                    <input
                      type="text"
                      placeholder="Filter classes..."
                      value={classSearch}
                      onChange={e => setClassSearch(e.target.value)}
                      className="px-2.5 py-1 text-[10px] border border-slate-200 bg-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {classes
                      .filter(c => c.name.toLowerCase().includes(classSearch.toLowerCase()))
                      .map(c => (
                        <label key={c.id} className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 hover:text-slate-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formClassIds.includes(c.id)}
                            onChange={e => {
                              if (e.target.checked) setFormClassIds(prev => [...prev, c.id]);
                              else setFormClassIds(prev => prev.filter(id => id !== c.id));
                            }}
                            className="w-3.5 h-3.5 border-slate-300 rounded text-teal-700 focus:ring-teal-700"
                          />
                          {c.name}
                        </label>
                      ))}
                  </div>
                </div>

                {/* Subject Search Assignments */}
                <div className="border rounded-2xl p-4 bg-slate-50/70 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Assign Curriculum Subjects</span>
                    <input
                      type="text"
                      placeholder="Filter subjects..."
                      value={subjectSearch}
                      onChange={e => setSubjectSearch(e.target.value)}
                      className="px-2.5 py-1 text-[10px] border border-slate-200 bg-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {defaultSubjects
                      .filter(s => s.toLowerCase().includes(subjectSearch.toLowerCase()))
                      .map(s => (
                        <label key={s} className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 hover:text-slate-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formSubjects.includes(s)}
                            onChange={e => {
                              if (e.target.checked) setFormSubjects(prev => [...prev, s]);
                              else setFormSubjects(prev => prev.filter(subj => subj !== s));
                            }}
                            className="w-3.5 h-3.5 border-slate-300 rounded text-teal-700 focus:ring-teal-700"
                          />
                          {s}
                        </label>
                      ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => { setAddModalOpen(false); resetForm(); }}
                    className="flex-1 px-4 py-2.5 border hover:bg-slate-50 font-extrabold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl disabled:opacity-50 transition-all"
                  >
                    {submitting ? 'Processing...' : addMode === 'associate' ? 'Associate Teacher' : 'Create Teacher'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ─── EDIT TEACHER MODAL ────────────────────────────────────────────────── */}
      {editModalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4" /> Edit Profile Details
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Modify workspace profile configuration for {selectedTeacher.name}.</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Instructor Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Phone Number</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Qualifications</label>
                  <input
                    type="text"
                    value={formQualification}
                    onChange={e => setFormQualification(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Experience</label>
                  <input
                    type="text"
                    value={formExperience}
                    onChange={e => setFormExperience(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border hover:bg-slate-50 font-extrabold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Saving modifications…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PROFILE DRAWER ────────────────────────────────────────────────────── */}
      {profileDrawerOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex justify-end z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between select-none animate-slide-left">
            <div className="space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                  <Briefcase className="w-5 h-5 text-teal-800" /> Instructor Dossier
                </h3>
                <button onClick={() => setProfileDrawerOpen(false)} className="text-slate-400 hover:text-slate-800 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Avatar Dossier Header */}
              <div className="flex flex-col items-center text-center space-y-2 py-4 bg-slate-50 rounded-2xl border">
                <div className="w-16 h-16 rounded-full bg-teal-800 text-white flex items-center justify-center font-black text-lg shadow-md border-2 border-white">
                  {selectedTeacher.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm">{selectedTeacher.name}</h4>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[9px] font-black uppercase">
                  {selectedTeacher.qualification || 'Academic Staff'}
                </span>
              </div>

              {/* Contact Information */}
              <div className="space-y-3.5">
                <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Contact Parameters</h5>
                <div className="space-y-2 bg-slate-50/50 p-4 border rounded-2xl text-xs">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{selectedTeacher.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{selectedTeacher.phone || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Experience and Academic Bio */}
              <div className="space-y-3.5">
                <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Professional Credentials</h5>
                <div className="space-y-3 bg-slate-50/50 p-4 border rounded-2xl text-xs text-slate-600">
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="font-semibold text-slate-500">Qualifications</span>
                    <span className="font-extrabold text-slate-850">{selectedTeacher.qualification || 'Not Specified'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="font-semibold text-slate-500">Teaching Tenure</span>
                    <span className="font-extrabold text-slate-850">{selectedTeacher.experience || 'Not Specified'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="font-semibold text-slate-500">Status</span>
                    <span className={`font-black uppercase tracking-wider text-[9px] px-2 py-0.5 rounded-lg border ${
                      selectedTeacher.isActive ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {selectedTeacher.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scope assigned */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Course Curriculum Assignments</h5>
                <div className="space-y-3">
                  {/* Classes */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold mb-1.5 block">Assigned Classes</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTeacher.classes.length > 0 ? (
                        selectedTeacher.classes.map(c => (
                          <span key={c.id} className="px-2.5 py-1 bg-teal-50/70 border border-teal-100/60 rounded-xl text-[10px] font-bold text-teal-900">
                            🏫 {c.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[10px]">No assigned classes</span>
                      )}
                    </div>
                  </div>

                  {/* Subjects */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold mb-1.5 block">Assigned Subjects</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTeacher.subjects.length > 0 ? (
                        selectedTeacher.subjects.map(s => (
                          <span key={s} className="px-2.5 py-1 bg-violet-50/70 border border-violet-100/60 rounded-xl text-[10px] font-bold text-violet-900">
                            📚 {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[10px]">No assigned subjects</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setProfileDrawerOpen(false)}
              className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all mt-6"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}

      {/* ─── CLASS ASSIGNMENT MANAGER DRAWER ─────────────────────────────────────── */}
      {assignmentDrawerOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between select-none animate-slide-left">
            <div className="space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                    <Sliders className="w-5 h-5 text-teal-850" /> Class Assignment Manager
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Define academic curriculum for {selectedTeacher.name}</p>
                </div>
                <button onClick={() => setAssignmentDrawerOpen(false)} className="text-slate-400 hover:text-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Class Checkbox lists */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Assign Classes</span>
                  <input
                    type="text"
                    placeholder="Search classes..."
                    value={classSearch}
                    onChange={e => setClassSearch(e.target.value)}
                    className="px-2.5 py-1 text-[10px] border border-slate-200 bg-white rounded-lg focus:outline-none"
                  />
                </div>
                <div className="border rounded-2xl p-4 bg-slate-50/70 space-y-2.5 max-h-56 overflow-y-auto">
                  {classes
                    .filter(c => c.name.toLowerCase().includes(classSearch.toLowerCase()))
                    .map(c => (
                      <label key={c.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formClassIds.includes(c.id)}
                          onChange={e => {
                            if (e.target.checked) setFormClassIds(prev => [...prev, c.id]);
                            else setFormClassIds(prev => prev.filter(id => id !== c.id));
                          }}
                          className="w-4 h-4 border-slate-300 rounded text-teal-700 focus:ring-teal-700"
                        />
                        🏫 {c.name}
                      </label>
                    ))}
                </div>
              </div>

              {/* Subject Checkbox lists */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Assign Subjects</span>
                  <input
                    type="text"
                    placeholder="Search subjects..."
                    value={subjectSearch}
                    onChange={e => setSubjectSearch(e.target.value)}
                    className="px-2.5 py-1 text-[10px] border border-slate-200 bg-white rounded-lg focus:outline-none"
                  />
                </div>
                <div className="border rounded-2xl p-4 bg-slate-50/70 space-y-2.5 max-h-56 overflow-y-auto">
                  {defaultSubjects
                    .filter(s => s.toLowerCase().includes(subjectSearch.toLowerCase()))
                    .map(s => (
                      <label key={s} className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formSubjects.includes(s)}
                          onChange={e => {
                            if (e.target.checked) setFormSubjects(prev => [...prev, s]);
                            else setFormSubjects(prev => prev.filter(subj => subj !== s));
                          }}
                          className="w-4 h-4 border-slate-300 rounded text-teal-700 focus:ring-teal-700"
                        />
                        📚 {s}
                      </label>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t mt-6">
              <button
                onClick={() => setAssignmentDrawerOpen(false)}
                className="flex-1 px-4 py-2.5 border hover:bg-slate-50 font-extrabold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAssignments}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl disabled:opacity-50 transition-all"
              >
                {submitting ? 'Saving scope…' : 'Save Assignments'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
