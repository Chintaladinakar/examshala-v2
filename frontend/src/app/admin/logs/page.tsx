'use client';

import React, { useState, useEffect } from 'react';
import { fetchJson } from '@/lib/api';

interface Log {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
  metadata?: any;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded log IDs for metadata viewing
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Filters State
  const [userSearch, setUserSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getCookie('session_token');
      const headers = { Authorization: `Bearer ${token}` };

      // We fetch all recent logs and filter client-side for dynamic reactivity
      const response = await fetchJson<{ success: boolean; data: Log[] }>('/api/admin/logs', { headers });
      setLogs(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
      setError(err.message || 'Failed to sync with central audit log stream.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Apply filters client-side
  useEffect(() => {
    let result = [...logs];

    // Search filter
    if (userSearch.trim()) {
      const searchLower = userSearch.toLowerCase();
      result = result.filter(
        log =>
          (log.userName && log.userName.toLowerCase().includes(searchLower)) ||
          (log.userEmail && log.userEmail.toLowerCase().includes(searchLower)) ||
          (log.userId && log.userId.toLowerCase().includes(searchLower))
      );
    }

    // Action filter
    if (actionFilter) {
      result = result.filter(log => log.action === actionFilter);
    }

    // Entity filter
    if (entityFilter) {
      result = result.filter(log => log.entity === entityFilter);
    }

    setFilteredLogs(result);
  }, [logs, userSearch, actionFilter, entityFilter]);

  const toggleExpandLog = (id: string) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Audit Logs Explorer</h2>
          <p className="text-slate-500 mt-1">Platform monitor logging all security events, user status toggles, and tenant configurations.</p>
        </div>
        <button
          onClick={loadLogs}
          className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-sm transition-all border border-slate-200 shadow-sm shrink-0"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
          </svg>
          Sync Feed
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* User Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by actor name or email..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
          />
        </div>

        {/* Action Select */}
        <div>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
          >
            <option value="">All Operation Actions</option>
            <option value="USER_CREATED">USER_CREATED (Creation)</option>
            <option value="WORKSPACE_CREATED">WORKSPACE_CREATED (Creation)</option>
            <option value="INVITE_SENT">INVITE_SENT (Dispatched)</option>
            <option value="ROLE_ASSIGNED">ROLE_ASSIGNED (Updates)</option>
          </select>
        </div>

        {/* Entity Select */}
        <div>
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-950/20 focus:border-teal-950 transition-all text-sm"
          >
            <option value="">All Target Entities</option>
            <option value="USER">USER</option>
            <option value="WORKSPACE">WORKSPACE</option>
            <option value="INVITE">INVITE</option>
            <option value="SYSTEM">SYSTEM</option>
          </select>
        </div>
      </div>

      {/* Logs Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.01)] overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-4 animate-pulse">
            <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-2xl">📋</div>
            <div className="text-sm font-semibold">Loading system audit trail...</div>
          </div>
        ) : error ? (
          <div className="p-12 text-center max-w-md mx-auto text-rose-600">
            <span className="text-2xl block mb-2">⚠️</span>
            <p className="text-sm font-bold">{error}</p>
            <button
              onClick={() => loadLogs()}
              className="mt-4 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <span className="text-3xl block">📋</span>
            <h3 className="font-bold text-slate-700">No events matched filters</h3>
            <p className="text-xs max-w-xs mx-auto">Try clearing search phrases or selection filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="w-8 px-4 py-4"></th>
                  <th className="px-6 py-4">Administrative Event</th>
                  <th className="px-6 py-4">Acting User</th>
                  <th className="px-6 py-4">Target Entity</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  const logDate = new Date(log.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  // Badges
                  let entityBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (log.entity === 'USER') entityBadge = 'bg-teal-50 text-teal-850 border-teal-100';
                  if (log.entity === 'WORKSPACE') entityBadge = 'bg-indigo-50 text-indigo-850 border-indigo-100';
                  if (log.entity === 'INVITE') entityBadge = 'bg-amber-50 text-amber-850 border-amber-100';

                  let actionIcon = '⚙️';
                  if (log.action === 'USER_CREATED') actionIcon = '👤';
                  if (log.action === 'WORKSPACE_CREATED') actionIcon = '🏢';
                  if (log.action === 'INVITE_SENT') actionIcon = '✉️';
                  if (log.action === 'ROLE_ASSIGNED') actionIcon = '🔑';

                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        className={`hover:bg-slate-50/40 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50/20' : ''}`}
                        onClick={() => toggleExpandLog(log.id)}
                      >
                        <td className="pl-4 pr-1 py-4 text-center">
                          <span className={`text-[10px] text-slate-400 block transition-transform duration-250 ${isExpanded ? 'rotate-90' : ''}`}>
                            ▶
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-sm">
                              {actionIcon}
                            </div>
                            <span className="font-bold text-slate-800 text-sm">{log.action}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-slate-800 text-xs">{log.userName || 'System (Cron/Daemon)'}</div>
                            {log.userEmail && <div className="text-slate-400 text-[10px]">{log.userEmail}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${entityBadge}`}>
                              {log.entity}
                            </span>
                            <span className="text-[10px] text-slate-450 font-mono">
                              ID: {log.entityId ? log.entityId.substring(0, 8) : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-400 font-semibold">{logDate}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandLog(log.id);
                            }}
                            className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100"
                          >
                            {isExpanded ? 'Collapse' : 'Audit Data'}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable metadata inspector */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={6} className="px-10 py-4.5 border-t border-slate-100/50">
                            <div className="space-y-3">
                              <div className="text-[11px] font-bold text-slate-450 uppercase tracking-wider">
                                System Audit AuditMetadata Details
                              </div>
                              <pre className="text-[11.5px] text-slate-700 bg-slate-800/90 text-teal-350 p-4.5 rounded-xl overflow-x-auto font-mono max-w-full leading-relaxed shadow-inner">
                                {JSON.stringify({
                                  eventId: log.id,
                                  actionType: log.action,
                                  targetEntity: log.entity,
                                  targetId: log.entityId,
                                  triggeringUserId: log.userId,
                                  triggeringUserEmail: log.userEmail,
                                  timestamp: log.createdAt,
                                  customMetadataPayload: log.metadata || {}
                                }, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
