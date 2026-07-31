"use client";

import React, { useState } from 'react';
import { User, Users, Mail, Link as LinkIcon, Trash2, Clock, CheckCircle2, AlertTriangle, ShieldAlert, BookOpen, Calendar, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { fetchJson } from '@/lib/api';
import InlineError from '@/components/ui/InlineError';
import { logDeveloperError } from '@/lib/error-handler';
import { useToast } from '@/components/ui/ToastProvider';

export default function ProfileTabsController({ initialProfile, initialParents }: { initialProfile: any, initialParents: any[] }) {
  const [activeTab, setActiveTab] = useState<'general' | 'parents'>('general');

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Nav for profile */}
      <div className="md:w-64 shrink-0">
        <nav className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 select-none">
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm whitespace-nowrap cursor-pointer",
              activeTab === 'general' ? "bg-white text-teal-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <User className="w-4 h-4" /> General Information
          </button>
          <button
            onClick={() => setActiveTab('parents')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm whitespace-nowrap cursor-pointer",
              activeTab === 'parents' ? "bg-white text-teal-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Users className="w-4 h-4" /> Parent Connections
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {activeTab === 'general' && (
          <div className="space-y-6">
            
            {/* Top overview card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6 select-none">
              <div className="relative w-24 h-24 rounded-full bg-teal-50 border-2 border-teal-500/20 flex items-center justify-center text-teal-700 overflow-hidden shrink-0 shadow-inner">
                {initialProfile?.profilePhoto ? (
                  <img src={initialProfile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-extrabold">{initialProfile?.fullName ? initialProfile.fullName[0].toUpperCase() : 'S'}</span>
                )}
              </div>
              <div className="text-center md:text-left space-y-1 flex-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{initialProfile?.fullName || 'N/A'}</h2>
                  <span className="bg-teal-50 text-teal-700 border border-teal-100 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full select-none">Student</span>
                </div>
                <p className="text-sm text-slate-500 font-medium">ID: <span className="font-mono font-bold text-slate-700">{initialProfile?.studentId || 'N/A'}</span></p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-slate-400 pt-1 select-none">
                  <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-teal-600" /> {initialProfile?.className || 'N/A'} - {initialProfile?.section || 'N/A'}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-teal-600" /> AY {initialProfile?.academicYear || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Grid for details cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Card 1: Academic & Basic Details */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2 select-none">
                  <User className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Basic Academic Info</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 select-none">Roll Number</label>
                    <div className="text-sm font-bold text-slate-800 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">{initialProfile?.rollNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 select-none">Class / Grade</label>
                    <div className="text-sm font-bold text-slate-800 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">{initialProfile?.className || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 select-none">Section</label>
                    <div className="text-sm font-bold text-slate-800 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">{initialProfile?.section || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 select-none">Academic Year</label>
                    <div className="text-sm font-bold text-slate-800 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">{initialProfile?.academicYear || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Card 2: Contact Information */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2 select-none">
                  <Mail className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Contact Information</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 select-none">Email Address</label>
                    <div className="text-sm font-bold text-slate-800 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl truncate">{initialProfile?.email || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 select-none">Mobile Number</label>
                    <div className="text-sm font-bold text-slate-800 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">{initialProfile?.mobileNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 select-none">Parent / Guardian Name</label>
                    <div className="text-sm font-bold text-slate-800 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">{initialProfile?.parentName || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1 select-none">Parent Contact Number</label>
                    <div className="text-sm font-bold text-slate-800 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">{initialProfile?.parentMobile || 'N/A'}</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Card 3: Academic Summary (attempted assessments count) */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 select-none">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-850 tracking-tight">Academic Progress Summary</h3>
                  <p className="text-xs text-slate-450 font-semibold mt-0.5">Total number of mock exams and assessments taken on ExamShala.</p>
                </div>
              </div>
              <div className="text-center sm:text-right shrink-0">
                <span className="text-3xl font-black text-amber-600 tracking-tight">{initialProfile?.totalAssessmentsAttempted ?? 0}</span>
                <span className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mt-0.5">Assessments Taken</span>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'parents' && <ParentsTab initialParents={initialParents} />}
      </div>
    </div>
  );
}

function ParentsTab({ initialParents }: { initialParents: any[] }) {
  const router = useRouter();
  const { showError, showMessage } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRelation, setInviteRelation] = useState('guardian');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const maxParents = 3;
  const currentCount = initialParents.filter(p => ['active', 'pending'].includes(p.status)).length;
  const canAddMore = currentCount < maxParents;

  const handleLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !canAddMore) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      await fetchJson('/api/proxy/api/student/parents/link-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, relation: inviteRelation }),
        action: 'submit',
      });

      setInviteEmail('');
      showMessage('Invite sent.', 'success');
      router.refresh(); // Triggers the Server Component to re-fetch
    } catch (err) {
      logDeveloperError(err, { action: 'submit', feature: 'parents_link_request' });
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRemoval = async (linkId: string) => {
    try {
      await fetchJson('/api/proxy/api/student/parents/remove-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId }),
        action: 'delete',
      });
      
      showMessage('Removal requested.', 'success');
      router.refresh();
    } catch (err) {
      logDeveloperError(err, { action: 'delete', feature: 'parents_remove_request' });
      showError(err, { action: 'delete' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Active Links Wrapper */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Linked Parents</h2>
            <p className="text-sm text-slate-500 mt-1">Parents can view your progress and assign approved material.</p>
          </div>
          <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium tracking-wide">
            {currentCount} / {maxParents}
          </div>
        </div>

        {initialParents.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">No parents linked yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {initialParents.map((parent) => (
              <LinkedParentCard 
                key={parent.id} 
                parent={parent} 
                onRequestRemoval={() => handleRequestRemoval(parent.id)} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Invite Form */}
      {canAddMore ? (
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Invite a Parent</h3>
          <p className="text-sm text-slate-500 mb-6">They will receive an email to create an account or link existing ones.</p>

          <InlineError error={error} action="submit" className="bg-rose-50 text-rose-600 px-4 py-2 rounded-lg text-sm mb-4" />

          <form onSubmit={handleLinkRequest} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input 
                type="email" 
                placeholder="parent@email.com" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-all font-medium"
              />
            </div>
            <select 
              value={inviteRelation}
              onChange={(e) => setInviteRelation(e.target.value)}
              className="w-full sm:w-40 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium appearance-none"
            >
              <option value="father">Father</option>
              <option value="mother">Mother</option>
              <option value="guardian">Guardian</option>
            </select>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <LinkIcon className="w-4 h-4" /> {isSubmitting ? 'Sending...' : 'Send Invite'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">Maximum Links Reached</h3>
            <p className="text-sm text-amber-700 mt-1">
              You have reached the limit of 3 parent links. To add a new parent, you must request removal of an existing one.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkedParentCard({ parent, onRequestRemoval }: { parent: any, onRequestRemoval: () => void }) {
  const StatusBadge = () => {
    switch(parent.status) {
      case 'active':
        return <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md"><CheckCircle2 className="w-3.5 h-3.5"/> Active</span>;
      case 'pending':
        return <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md"><Clock className="w-3.5 h-3.5"/> Pending</span>;
      case 'removal_requested':
        return <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md"><AlertTriangle className="w-3.5 h-3.5"/> Removal Requested</span>;
      default: return null;
    }
  };

  const displayName = parent.Parent?.name || parent.pendingParentEmail;
  const displayEmail = parent.Parent?.email || parent.pendingParentEmail;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
          {displayName ? displayName[0].toUpperCase() : <Mail className="w-4 h-4" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-slate-900">{displayName}</h4>
            <StatusBadge />
          </div>
          <div className="text-sm text-slate-500 capitalize flex items-center gap-2 mt-0.5">
            {parent.relation} • {displayEmail}
          </div>
        </div>
      </div>
      
      {parent.status !== 'removal_requested' && (
        <button 
          onClick={onRequestRemoval}
          className="text-sm font-medium text-slate-500 hover:text-rose-600 transition-colors px-3 py-1.5 border border-transparent hover:border-rose-100 hover:bg-rose-50 rounded-lg flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Trash2 className="w-4 h-4" /> Request Removal
        </button>
      )}
    </div>
  );
}
