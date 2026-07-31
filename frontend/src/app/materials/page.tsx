'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ui/ToastProvider';
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  FolderOpen,
  Trash2,
  Download,
  Eye,
  ExternalLink,
  X,
} from 'lucide-react';

type ClassLite = { id: string; name: string };
type Material = {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  subject: string;
  chapter?: string | null;
  topic?: string | null;
  visibility: string;
  viewCount: number;
  downloadCount: number;
  uploadDate: string;
  UploadedBy?: { id: string; name: string };
  Class?: { id: string; name: string } | null;
};

const TYPES = ['PDF', 'DOC', 'PPT', 'EXCEL', 'IMAGE', 'VIDEO', 'ZIP', 'LINK', 'NOTES'];
const VISIBILITIES = ['draft', 'scheduled', 'published', 'hidden'];

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = (await res.json().catch(() => null)) as any;
  if (!res.ok || !body?.success) {
    throw new Error(body?.error?.message || body?.message || 'Request failed');
  }
  return body.data as T;
}

export default function MaterialsPage() {
  const { showError, showMessage } = useToast();

  const [classes, setClasses] = useState<ClassLite[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    type: 'PDF',
    fileUrl: '',
    subject: '',
    chapter: '',
    topic: '',
    classId: '',
    visibility: 'published',
  });

  async function loadClasses() {
    try {
      const data = await apiJson<ClassLite[]>('/api/classes');
      setClasses(data);
    } catch (e) {
      showError(e);
    }
  }

  async function loadMaterials() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (classFilter) params.set('classId', classFilter);
      if (typeFilter) params.set('type', typeFilter);
      if (search) params.set('search', search);
      const data = await apiJson<Material[]>(`/api/materials?${params.toString()}`);
      setMaterials(data);
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(loadMaterials, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter, typeFilter, search]);

  const filtered = useMemo(() => materials, [materials]);

  async function createMaterial(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiJson('/api/materials', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          fileUrl: form.fileUrl,
          subject: form.subject,
          chapter: form.chapter || undefined,
          topic: form.topic || undefined,
          classId: form.classId || undefined,
          visibility: form.visibility,
        }),
      });
      showMessage('Material uploaded', 'success');
      setShowCreate(false);
      setForm({ title: '', type: 'PDF', fileUrl: '', subject: '', chapter: '', topic: '', classId: '', visibility: 'published' });
      await loadMaterials();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  }

  async function deleteMaterial(id: string) {
    if (!window.confirm('Delete this material? This cannot be undone.')) return;
    try {
      await apiJson(`/api/materials/${id}`, { method: 'DELETE' });
      showMessage('Material deleted', 'success');
      await loadMaterials();
    } catch (e) {
      showError(e);
    }
  }

  async function openMaterial(m: Material) {
    try {
      await apiJson(`/api/materials/${m.id}/download`, { method: 'POST' });
    } catch {
      // Download tracking is best-effort; don't block opening the file if it fails.
    }
    window.open(m.fileUrl, '_blank', 'noopener,noreferrer');
    loadMaterials();
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-teal-850" />
                Study Materials
              </h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-1">
                Upload and organize resources for your classes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700"
              >
                <option value="">All Types</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button
                onClick={loadMaterials}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-900 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Upload Material
              </button>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="bg-white border rounded-3xl shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-xs font-bold text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-teal-800 mx-auto mb-2" />
                Loading materials...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-extrabold text-slate-500">No materials found</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Subject / Class</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Visibility</th>
                    <th className="px-6 py-4">Views / Downloads</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 text-xs text-slate-700">
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-slate-800">{m.title}</div>
                        {m.chapter && <div className="text-[10px] text-slate-400 mt-0.5">{m.chapter}{m.topic ? ` · ${m.topic}` : ''}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div>{m.subject}</div>
                        {m.Class && <div className="text-[10px] text-slate-400">{m.Class.name}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] font-extrabold uppercase">
                          {m.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase ${
                            m.visibility === 'published'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : m.visibility === 'draft'
                              ? 'bg-slate-100 border-slate-200 text-slate-500'
                              : m.visibility === 'scheduled'
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}
                        >
                          {m.visibility}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 mr-3"><Eye className="w-3 h-3" /> {m.viewCount}</span>
                        <span className="inline-flex items-center gap-1"><Download className="w-3 h-3" /> {m.downloadCount}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openMaterial(m)}
                            className="p-2 border rounded-lg hover:bg-indigo-50 text-indigo-600"
                            title="Open"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteMaterial(m.id)}
                            className="p-2 border rounded-lg hover:bg-rose-50 text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">Upload Material</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={createMaterial} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600">File / Link URL</label>
                <input
                  required
                  type="url"
                  placeholder="https://..."
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Subject</label>
                  <input
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Chapter</label>
                  <input
                    value={form.chapter}
                    onChange={(e) => setForm({ ...form, chapter: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Topic</label>
                  <input
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Class (optional)</label>
                  <select
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  >
                    <option value="">Not class-specific</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Visibility</label>
                  <select
                    value={form.visibility}
                    onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  >
                    {VISIBILITIES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-teal-900 hover:bg-teal-800 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {saving ? 'Uploading...' : 'Upload Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
