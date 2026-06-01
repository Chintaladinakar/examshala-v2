'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';
import {
  Sparkles,
  Calendar,
  Building,
  BookOpen,
  Mail,
  CheckCircle,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  PartyPopper,
  RefreshCw
} from 'lucide-react';

async function apiPost<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const resBody = (await res.json().catch(() => null)) as any;
  if (!res.ok || !resBody?.success) {
    throw new Error(resBody?.error?.message || 'Failed to complete setup configuration');
  }
  return resBody.data as T;
}

export default function WorkspaceSetupPage() {
  const router = useRouter();
  const { showError, showMessage } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const nextStep = () => setStep(p => p + 1);
  const prevStep = () => setStep(p => p - 1);

  // Step 1: Academic Year
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [term, setTerm] = useState('Term 1');

  // Step 2: Create Classes
  const [classesList, setClassesList] = useState<string[]>(['Grade 8A', 'Grade 8B', 'Grade 9A']);
  const [newClassName, setNewClassName] = useState('');

  // Step 3: Create Subjects
  const [subjectsList, setSubjectsList] = useState<string[]>(['Mathematics', 'Science', 'English']);
  const [newSubjectName, setNewSubjectName] = useState('');

  // Step 4: Invite Teachers
  const [invites, setInvites] = useState<{ name: string; email: string }[]>([
    { name: 'Dr. John Smith', email: 'principal.smith@examshala.com' }
  ]);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');

  const handleAddClass = () => {
    const name = newClassName.trim();
    if (!name) return;
    if (classesList.includes(name)) {
      return showMessage('This class name already exists.', 'info');
    }
    setClassesList(prev => [...prev, name]);
    setNewClassName('');
  };

  const handleRemoveClass = (index: number) => {
    setClassesList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddSubject = () => {
    const name = newSubjectName.trim();
    if (!name) return;
    if (subjectsList.includes(name)) {
      return showMessage('This subject already exists.', 'info');
    }
    setSubjectsList(prev => [...prev, name]);
    setNewSubjectName('');
  };

  const handleRemoveSubject = (index: number) => {
    setSubjectsList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddTeacher = () => {
    const name = newTeacherName.trim();
    const email = newTeacherEmail.trim().toLowerCase();
    if (!name || !email) return;
    if (invites.some(i => i.email === email)) {
      return showMessage('An invitation is already queued for this email.', 'info');
    }
    setInvites(prev => [...prev, { name, email }]);
    setNewTeacherName('');
    setNewTeacherEmail('');
  };

  const handleRemoveTeacher = (index: number) => {
    setInvites(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleCompleteSetup = async () => {
    try {
      setLoading(true);

      // Save Classes in DB
      for (const name of classesList) {
        await apiPost('/api/principal/settings', {
          entityType: 'class',
          name,
        });
      }

      // Save Subjects in DB
      for (const name of subjectsList) {
        await apiPost('/api/principal/settings', {
          entityType: 'subject',
          name,
        });
      }

      // Save Teachers in DB
      for (const inv of invites) {
        await fetch('/api/principal/teachers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: inv.name,
            email: inv.email,
            password: 'password123',
            subjects: subjectsList,
          }),
        });
      }

      showMessage('Workspace setup completed successfully! Redirecting...', 'success');
      setStep(5);
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectToDashboard = () => {
    router.push('/principledashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-y-auto select-none">
      
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <header className="max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-900 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white text-teal-950 font-black rounded-lg flex items-center justify-center text-sm shadow-md">
            E
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            Examshala
          </span>
        </div>
        <span className="text-[10px] text-teal-400 font-extrabold uppercase bg-teal-500/10 border border-teal-500/25 px-2.5 py-1 rounded-lg">
          ⚙️ First-Time Setup Wizard
        </span>
      </header>

      {/* Main Wizard */}
      <main className="max-w-xl w-full mx-auto px-6 py-10 flex-1 flex items-center justify-center z-10">
        <div className="bg-slate-900/60 border border-slate-850 rounded-3xl p-6 md:p-8 w-full shadow-2xl space-y-6">
          
          {/* Progress Timeline Header */}
          {step < 5 && (
            <div className="flex justify-between items-center px-4">
              {[1, 2, 3, 4].map(sNum => (
                <div key={sNum} className="flex flex-col items-center">
                  <div 
                    className={`w-7 h-7 rounded-full flex items-center justify-center border text-[11px] font-black transition-all ${
                      sNum < step 
                        ? 'bg-teal-500 text-slate-950 border-teal-500' 
                        : sNum === step 
                        ? 'bg-slate-950 text-teal-400 border-teal-500 shadow-md ring-2 ring-teal-500/10'
                        : 'bg-slate-950 text-slate-500 border-slate-850'
                    }`}
                  >
                    {sNum}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 1: Academic Year */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-base font-black text-white flex items-center gap-1.5">
                  <Calendar className="w-5 h-5 text-teal-400" /> Define Academic Year
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">Select the active configuration parameters for grading cycles.</p>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Academic Calendar Year *</label>
                  <select
                    value={academicYear}
                    onChange={e => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="2026-2027">2026 - 2027 Academic Year</option>
                    <option value="2027-2028">2027 - 2028 Academic Year</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Current Term / Semester *</label>
                  <select
                    value={term}
                    onChange={e => setTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="Term 1">Term 1 (First Quarter)</option>
                    <option value="Term 2">Term 2 (Second Quarter)</option>
                    <option value="Term 3">Term 3 (Third Quarter)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Create Classes */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-base font-black text-white flex items-center gap-1.5">
                  <Building className="w-5 h-5 text-teal-400" /> Create Initial Classes
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">Define grade classrooms and study sections.</p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Grade 10B"
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddClass}
                    className="px-3.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Class
                  </button>
                </div>

                <div className="border border-slate-850 bg-slate-950/40 p-3 rounded-2xl max-h-48 overflow-y-auto space-y-2">
                  {classesList.length === 0 ? (
                    <span className="text-[10px] text-slate-500 font-semibold block text-center py-4">No classes created. Add at least one.</span>
                  ) : (
                    classesList.map((cName, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-950 p-2.5 border border-slate-900 rounded-xl text-xs">
                        <span className="font-extrabold text-slate-200">🏫 {cName}</span>
                        <button onClick={() => handleRemoveClass(idx)} className="text-rose-400 hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Create Subjects */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-base font-black text-white flex items-center gap-1.5">
                  <BookOpen className="w-5 h-5 text-teal-400" /> Specify Core Subjects
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">Define key curriculum subjects for course schedules.</p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Science, Biology"
                    value={newSubjectName}
                    onChange={e => setNewSubjectName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="px-3.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Subject
                  </button>
                </div>

                <div className="border border-slate-850 bg-slate-950/40 p-3 rounded-2xl max-h-48 overflow-y-auto space-y-2">
                  {subjectsList.length === 0 ? (
                    <span className="text-[10px] text-slate-500 font-semibold block text-center py-4">No subjects registered. Add core disciplines.</span>
                  ) : (
                    subjectsList.map((sName, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-950 p-2.5 border border-slate-900 rounded-xl text-xs">
                        <span className="font-extrabold text-slate-200">📚 {sName}</span>
                        <button onClick={() => handleRemoveSubject(idx)} className="text-rose-400 hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Invite Teachers */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-base font-black text-white flex items-center gap-1.5">
                  <Mail className="w-5 h-5 text-teal-400" /> Queue Instructor Invitations
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">Queue early registration credentials for educational staff. You can skip this step.</p>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Instructor Name"
                    value={newTeacherName}
                    onChange={e => setNewTeacherName(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                  <input
                    type="email"
                    placeholder="Instructor Email"
                    value={newTeacherEmail}
                    onChange={e => setNewTeacherEmail(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTeacher}
                  className="w-full py-2 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-teal-400 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Teacher to Queue
                </button>

                <div className="border border-slate-850 bg-slate-950/40 p-3 rounded-2xl max-h-40 overflow-y-auto space-y-2">
                  {invites.length === 0 ? (
                    <span className="text-[10px] text-slate-500 font-semibold block text-center py-4">No teacher invites queued. Feel free to skip.</span>
                  ) : (
                    invites.map((teacher, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-950 p-2.5 border border-slate-900 rounded-xl text-xs">
                        <div>
                          <span className="font-extrabold text-slate-200 block">{teacher.name}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{teacher.email}</span>
                        </div>
                        <button onClick={() => handleRemoveTeacher(idx)} className="text-rose-400 hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Complete Setup */}
          {step === 5 && (
            <div className="space-y-6 text-center animate-in fade-in duration-200 py-6">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto">
                <PartyPopper className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">Workspace Deployed!</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-semibold max-w-xs mx-auto">
                  Your academic configurations have been successfully applied. The institution workspace is live.
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 border border-slate-850 rounded-2xl text-[10px] text-left space-y-2 font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Academic Calendar:</span>
                  <span className="text-white font-extrabold">{academicYear} ({term})</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-850 pt-2">
                  <span className="text-slate-500">Configured Grades:</span>
                  <span className="text-teal-400 font-extrabold">{classesList.length} Classes Deployed</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-850 pt-2">
                  <span className="text-slate-500">Active Curriculum:</span>
                  <span className="text-violet-400 font-extrabold">{subjectsList.length} Disciplines Configured</span>
                </div>
              </div>

              <button
                onClick={handleRedirectToDashboard}
                className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                Go To Principal Dashboard <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Controls */}
          {step < 5 && (
            <div className="flex gap-3 pt-4 border-t border-slate-850">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center justify-center gap-1 px-4 py-2 border border-slate-800 hover:bg-slate-850 font-extrabold text-xs rounded-xl transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
              )}
              
              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteSetup}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Deploying Configurations...
                    </>
                  ) : (
                    <>
                      Deploy Workspace <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-[10px] text-slate-700 font-medium z-10 border-t border-slate-900">
        © {new Date().getFullYear()} Examshala Examination Portal.
      </footer>
    </div>
  );
}
