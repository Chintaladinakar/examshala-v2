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
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  X,
  RefreshCw,
  ArrowRightLeft
} from 'lucide-react';

type ClassLite = { id: string; name: string };
type Student = {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  parentName: string;
  parentContact: string;
  class: ClassLite | null;
  attendancePercent: number;
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

export default function PrincipalStudentsPage() {
  const { user } = useUser();
  const { showError, showMessage } = useToast();

  const isPrincipalMode = (user?.role || '').toLowerCase() === 'principal' && (user?.mode || 'principal') === 'principal';

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [transferClassId, setTransferClassId] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const filteredStudents = useMemo(() => {
    return students.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  async function loadData() {
    try {
      setLoading(true);
      const [studentsData, classesData] = await Promise.all([
        apiJson<Student[]>('/api/principal/students'),
        apiJson<any[]>('/api/classes'),
      ]);
      setStudents(studentsData);
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

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormParentName('');
    setFormParentPhone('');
    setFormClassId('');
    setFormPassword('');
    setSelectedStudent(null);
  };

  const openAddModal = () => {
    resetForm();
    setAddModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    setFormName(student.name);
    setFormEmail(student.email);
    setFormPhone(student.phone);
    setFormParentName(student.parentName);
    setFormParentPhone(student.parentContact);
    setEditModalOpen(true);
  };

  const openTransferModal = (student: Student) => {
    setSelectedStudent(student);
    setTransferClassId(student.class?.id || '');
    setTransferModalOpen(true);
  };

  const handleToggleStatus = async (student: Student) => {
    try {
      const nextActive = !student.isActive;
      const res = await apiJson<any>('/api/principal/students/update', {
        method: 'PATCH',
        body: JSON.stringify({
          studentId: student.id,
          action: 'toggle_status',
          isActive: nextActive,
        }),
      });
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, isActive: res.isActive, status: res.status } : s));
      showMessage(`Student account ${nextActive ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (e: any) {
      showError(e);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiJson<any>('/api/principal/students', {
        method: 'POST',
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          phone: formPhone,
          parentName: formParentName,
          parentPhone: formParentPhone,
          classId: formClassId || undefined,
          password: formPassword || undefined,
        }),
      });
      showMessage('Student created', 'success');
      setAddModalOpen(false);
      resetForm();
      loadData();
    } catch (e: any) {
      showError(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      setSubmitting(true);
      const res = await apiJson<any>('/api/principal/students/update', {
        method: 'PATCH',
        body: JSON.stringify({
          studentId: selectedStudent.id,
          action: 'update_profile',
          name: formName,
          email: formEmail,
          phone: formPhone,
          parentName: formParentName,
          parentPhone: formParentPhone,
        }),
      });
      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? {
        ...s,
        name: res.name,
        email: res.email,
        phone: res.phone,
        parentName: res.parentName,
        parentContact: res.parentContact,
      } : s));
      showMessage('Student profile updated successfully', 'success');
      setEditModalOpen(false);
      resetForm();
    } catch (e: any) {
      showError(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedStudent) return;
    try {
      setSubmitting(true);
      const res = await apiJson<any>('/api/principal/students/update', {
        method: 'PATCH',
        body: JSON.stringify({
          studentId: selectedStudent.id,
          action: 'transfer_class',
          targetClassId: transferClassId || undefined,
        }),
      });
      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, class: res.class } : s));
      showMessage('Student transferred successfully', 'success');
      setTransferModalOpen(false);
      resetForm();
    } catch (e: any) {
      showError(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isPrincipalMode) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 p-8 flex flex-col justify-center items-center">
          <div className="bg-white border p-12 rounded-3xl shadow-xl max-w-md text-center space-y-4">
            <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
            <h2 className="text-2xl font-black text-slate-800">Access Denied</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              This dashboard is exclusive to Principals.
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

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="w-8 h-8 text-teal-800" />
                Student Management
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Register students, assign classes, and track institution-wide attendance.
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 border rounded-2xl shadow-3xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search student by name, email, or ID..."
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

          <div className="bg-white border rounded-2xl shadow-3xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Attendance</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading && (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-xs text-slate-400 font-semibold">Loading students…</td></tr>
                  )}
                  {!loading && filteredStudents.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-xs text-slate-400 font-semibold">No students found</td></tr>
                  )}
                  {!loading && filteredStudents.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-800">{s.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold">{s.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[150px]">{s.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span>{s.phone || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {s.class ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-100">
                            🏫 {s.class.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-black ${s.attendancePercent >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {s.attendancePercent}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(s)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            s.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
                          }`}
                        >
                          {s.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {s.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openTransferModal(s)}
                            title="Transfer Class"
                            className="p-1.5 border rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(s)}
                            title="Edit Profile"
                            className="p-1.5 border rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ─── ADD STUDENT MODAL ─────────────────────────────────────── */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5 select-none">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-base font-black text-slate-800">Add Student Account</h3>
              <button onClick={() => { setAddModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStudent} className="space-y-3">
              <input required placeholder="Full Name" value={formName} onChange={e => setFormName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
              <input required type="email" placeholder="Email Address" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
              <input placeholder="Phone Number" value={formPhone} onChange={e => setFormPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Parent Name" value={formParentName} onChange={e => setFormParentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
                <input placeholder="Parent Phone" value={formParentPhone} onChange={e => setFormParentPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
              </div>
              <select value={formClassId} onChange={e => setFormClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35">
                <option value="">No Class Assigned</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="password" placeholder="Initial Password (optional, auto-generated if blank)" value={formPassword} onChange={e => setFormPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
              <div className="flex gap-2 pt-2 border-t">
                <button type="button" onClick={() => { setAddModalOpen(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 border text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50">
                  {submitting ? 'Creating…' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT STUDENT MODAL ─────────────────────────────────────── */}
      {editModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5 select-none">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-base font-black text-slate-800">Edit Student Profile</h3>
              <button onClick={() => { setEditModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <input required placeholder="Full Name" value={formName} onChange={e => setFormName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
              <input required type="email" placeholder="Email Address" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
              <input placeholder="Phone Number" value={formPhone} onChange={e => setFormPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Parent Name" value={formParentName} onChange={e => setFormParentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
                <input placeholder="Parent Phone" value={formParentPhone} onChange={e => setFormParentPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35" />
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <button type="button" onClick={() => { setEditModalOpen(false); resetForm(); }}
                  className="flex-1 px-4 py-2.5 border text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50">
                  {submitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TRANSFER CLASS MODAL ─────────────────────────────────────── */}
      {transferModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 space-y-5 select-none">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-base font-black text-slate-800">Transfer {selectedStudent.name}</h3>
              <button onClick={() => { setTransferModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <select value={transferClassId} onChange={e => setTransferClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/35">
              <option value="">Unassign from Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2 pt-2 border-t">
              <button type="button" onClick={() => { setTransferModalOpen(false); resetForm(); }}
                className="flex-1 px-4 py-2.5 border text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
              <button onClick={handleTransfer} disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50">
                {submitting ? 'Transferring…' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
