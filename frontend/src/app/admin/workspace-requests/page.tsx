'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/context/UserContext';
import {
  Sparkles,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Globe,
  Search,
  Filter,
  RefreshCw,
  FolderOpen,
  Calendar,
  X,
  FileCheck2,
  ChevronRight,
  Info
} from 'lucide-react';

type WorkspaceRequest = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  requesterId: string;
  institutionType: string;
  description: string;
  contactName: string;
  phone: string;
  email: string;
  studentsCount: string;
  teachersCount: string;
  academicType: string;
  country: string;
  state: string;
  city: string;
  address: string;
  website: string;
  socialLinks: Record<string, string>;
  rejectionReason: string;
};

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || 'Admin action failed');
  }
  return body.data as T;
}

export default function WorkspaceRequestsPage() {
  const { user, loading: profileLoading } = useUser();
  const { showError, showMessage } = useToast();
  const router = useRouter();

  const role = user?.role?.toLowerCase();
  const isOrgAdmin = role === 'org_admin';

  const [requests, setRequests] = useState<WorkspaceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WorkspaceRequest | null>(null);
  
  // Drawer & Modal control
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [evaluating, setEvaluating] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  async function loadRequests() {
    try {
      setLoading(true);
      const res = await apiFetch<WorkspaceRequest[]>('/api/admin/workspace-requests');
      setRequests(res);
    } catch (e: any) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOrgAdmin) {
      loadRequests();
    }
  }, [isOrgAdmin]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch = 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.contactName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || r.institutionType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [requests, searchQuery, statusFilter, typeFilter]);

  const handleApprove = async (request: WorkspaceRequest) => {
    try {
      setEvaluating(true);
      const res = await apiFetch<any>('/api/admin/workspace-requests', {
        method: 'PATCH',
        body: JSON.stringify({ workspaceId: request.id, action: 'approve' })
      });
      showMessage(`Workspace "${request.name}" approved successfully! Join Code: ${res.code}`, 'success');
      setDrawerOpen(false);
      await loadRequests();
    } catch (e: any) {
      showError(e);
    } finally {
      setEvaluating(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      setEvaluating(true);
      await apiFetch<any>('/api/admin/workspace-requests', {
        method: 'PATCH',
        body: JSON.stringify({
          workspaceId: selectedRequest.id,
          action: 'reject',
          rejectionReason
        })
      });
      showMessage(`Workspace "${selectedRequest.name}" rejected successfully.`, 'success');
      setRejectModalOpen(false);
      setDrawerOpen(false);
      setRejectionReason('');
      await loadRequests();
    } catch (e: any) {
      showError(e);
    } finally {
      setEvaluating(false);
    }
  };

  const openDrawer = (request: WorkspaceRequest) => {
    setSelectedRequest(request);
    setDrawerOpen(true);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-slate-955 flex flex-col justify-center items-center select-none text-slate-100 relative overflow-hidden">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
          <span className="text-xs font-bold text-slate-400">Verifying administrator authorization...</span>
        </div>
      </div>
    );
  }

  if (!isOrgAdmin) {
    return (
      <div className="min-h-screen bg-slate-955 flex flex-col justify-center items-center select-none text-slate-100 relative overflow-hidden">
        <div className="bg-slate-900 border border-slate-850 p-12 rounded-3xl shadow-2xl max-w-md text-center space-y-4 z-10">
          <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-black">Access Denied</h2>
          <p className="text-slate-400 text-xs leading-relaxed font-semibold">
            This administration workspace is restricted to EDUsphere Admins only.
          </p>
          <button
            onClick={() => router.push('/signin')}
            className="w-full py-2.5 bg-slate-855 hover:bg-slate-800 text-slate-200 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none text-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-8 h-8 text-teal-850" />
            Workspace Request Pipeline
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
            Audit, approve, and deploy institutional workspace nodes for platform onboarding requests.
          </p>
        </div>
        
        <button
          onClick={loadRequests}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 border hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Pipeline
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 border rounded-2xl shadow-3xs flex flex-wrap items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by workspace name or requester..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700/20"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Rejected Requests</option>
          </select>
        </div>

        {/* Institution Type Filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none"
        >
          <option value="ALL">All Institution Types</option>
          <option value="Tuition Center">Tuition Centers</option>
          <option value="School">Schools</option>
          <option value="Coaching Institute">Coaching Institutes</option>
          <option value="College">Colleges</option>
          <option value="Training Center">Training Centers</option>
        </select>
      </div>

      {/* Requests Directory Table */}
      <div className="bg-white border rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                <th className="px-6 py-4">Workspace Name</th>
                <th className="px-6 py-4">Institution Type</th>
                <th className="px-6 py-4">Requested By</th>
                <th className="px-6 py-4">Sizing (St / Te)</th>
                <th className="px-6 py-4">Request Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs font-bold text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-teal-850" />
                      <span>Syncing workspace pipeline database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <FolderOpen className="w-10 h-10 text-slate-350 mx-auto mb-2" />
                    <p className="text-xs font-extrabold text-slate-500">Pipeline is completely clear</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">No onboarding requests require approvals currently.</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map(r => {
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-all text-xs text-slate-700">
                      {/* Workspace Name */}
                      <td className="px-6 py-4">
                        <div>
                          <h4 className="font-extrabold text-slate-800 leading-snug">{r.name}</h4>
                          <span className="text-[9px] text-slate-400 font-semibold">{r.city || 'Coordinates Pending'}</span>
                        </div>
                      </td>

                      {/* Institution Type */}
                      <td className="px-6 py-4 font-bold">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 border rounded-lg text-[9px] uppercase tracking-wider">
                          🏫 {r.institutionType}
                        </span>
                      </td>

                      {/* Requested By */}
                      <td className="px-6 py-4">
                        <div>
                          <h4 className="font-extrabold text-slate-800 leading-snug">{r.contactName}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5"><Mail className="w-3 h-3 shrink-0" />{r.email}</span>
                        </div>
                      </td>

                      {/* Sizing */}
                      <td className="px-6 py-4 font-semibold">
                        <div className="space-y-0.5 text-[10px]">
                          <div>Students: <span className="font-black text-slate-800">{r.studentsCount}</span></div>
                          <div>Teachers: <span className="font-black text-slate-800">{r.teachersCount}</span></div>
                        </div>
                      </td>

                      {/* Request Date */}
                      <td className="px-6 py-4 text-slate-500 font-semibold">
                        <div className="flex items-center gap-1 text-[10px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        {r.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 text-[9px] font-black uppercase tracking-wider">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-600 text-[9px] font-black uppercase tracking-wider">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openDrawer(r)}
                          className="px-3.5 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-350 text-slate-700 font-bold text-[10px] rounded-xl transition-all cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          Review request <ChevronRight className="w-4.5 h-4.5 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── SLIDE OUT DETAILS DRAWER ────────────────────────────────────────── */}
      {drawerOpen && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex justify-end z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between select-none animate-slide-left">
            <div className="space-y-6 overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                    <FileCheck2 className="w-5 h-5 text-teal-850" /> Request Evaluation
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Audit onboard qualifications for {selectedRequest.name}.</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Institution Information */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Institution Parameters</h4>
                <div className="space-y-2 bg-slate-50 p-4 border rounded-2xl text-xs text-slate-600">
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="font-semibold text-slate-400">Workspace Name</span>
                    <span className="font-extrabold text-slate-800">{selectedRequest.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="font-semibold text-slate-400">Institution Type</span>
                    <span className="font-extrabold text-slate-800">{selectedRequest.institutionType}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="font-semibold text-slate-400">Delivery Format</span>
                    <span className="font-extrabold text-slate-800">{selectedRequest.academicType}</span>
                  </div>
                  {selectedRequest.description && (
                    <div className="py-1">
                      <span className="font-semibold text-slate-400 block mb-1">Institution Summary Bio</span>
                      <p className="bg-white border p-2.5 rounded-lg text-[10px] leading-relaxed font-semibold text-slate-500">
                        {selectedRequest.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Contact Coordinates</h4>
                <div className="space-y-2.5 bg-slate-50 p-4 border rounded-2xl text-xs text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <div className="font-extrabold text-slate-800 leading-snug">{selectedRequest.contactName}</div>
                      <span className="text-[9px] text-slate-450 uppercase font-black tracking-widest">Workspace Principal</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 border-t pt-2.5">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{selectedRequest.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{selectedRequest.phone}</span>
                  </div>
                </div>
              </div>

              {/* Location parameters */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Location Parameters</h4>
                <div className="space-y-2 bg-slate-50 p-4 border rounded-2xl text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold text-slate-800 leading-snug">{selectedRequest.city}, {selectedRequest.state}</div>
                      <div className="text-[10px] text-slate-450 font-semibold">{selectedRequest.address}, {selectedRequest.country}</div>
                    </div>
                  </div>
                  {selectedRequest.website && (
                    <div className="flex items-center gap-2.5 border-t pt-2.5">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <a href={`https://${selectedRequest.website}`} target="_blank" rel="noreferrer" className="text-teal-800 font-extrabold hover:underline">
                        {selectedRequest.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Alerts */}
              {selectedRequest.status === 'PENDING' && (
                <div className="flex items-start gap-2.5 bg-slate-50 p-3.5 border rounded-2xl">
                  <Info className="w-4.5 h-4.5 text-teal-850 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                    Approving workspace generates EXM credentials, binds owner to PRINCIPAL role, creates default classes/settings, and opens access setups.
                  </p>
                </div>
              )}
            </div>

            {/* Actions panel */}
            <div className="pt-4 border-t mt-6">
              {selectedRequest.status === 'PENDING' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setRejectModalOpen(true)}
                    disabled={evaluating}
                    className="px-4 py-2.5 border border-rose-200 hover:bg-rose-50 hover:text-rose-600 text-rose-500 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject request
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest)}
                    disabled={evaluating}
                    className="flex-1 px-4 py-2.5 bg-teal-950 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {evaluating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" /> Approve Workspace
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all"
                >
                  Close details
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ─── REJECTION MOTIVE DIALOG MODAL ────────────────────────────────────── */}
      {rejectModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-3xl border shadow-2xl p-5 space-y-4 select-none">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-1">
                <XCircle className="w-4.5 h-4.5 text-rose-500" /> Rejection Statement
              </h4>
              <button onClick={() => setRejectModalOpen(false)} className="text-slate-400 hover:text-slate-750">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleReject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Provide Reason for Rejection *</label>
                <select
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none"
                  required
                >
                  <option value="">Select rejection statement...</option>
                  <option value="Incomplete Information: Institution credentials could not be validated.">Incomplete Information</option>
                  <option value="Invalid Details: Provided phone or email address is unreachable.">Invalid Details</option>
                  <option value="Duplicate Institution: This academy is already registered on EDUsphere.">Duplicate Institution</option>
                  <option value="Invalid Academic Entity: Does not meet platform registration metrics.">Invalid Academic Entity</option>
                </select>
              </div>

              <div className="flex gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="flex-1 px-3 py-2 border hover:bg-slate-50 font-extrabold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={evaluating || !rejectionReason}
                  className="flex-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
