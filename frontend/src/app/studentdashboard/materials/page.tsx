'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  FileText, 
  Link as LinkIcon, 
  File, 
  Video, 
  Download, 
  ExternalLink, 
  Maximize2, 
  X, 
  Bookmark, 
  RefreshCw 
} from 'lucide-react';

type Material = {
  id: string;
  title: string;
  type: 'PDF' | 'DOC' | 'PPT' | 'LINK' | 'NOTES';
  fileUrl: string;
  subject: string;
  uploadedBy: string;
  uploadDate: string;
  fileSize?: string;
};

export default function MaterialsDashboard() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & State
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const [type, setType] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Smart preview state
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const getCookie = (name: string) => {
    if (typeof window === 'undefined') return '';
    return document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`))
      ?.split('=')[1] || '';
  };

  const loadMaterials = async (useCache = true) => {
    const token = getCookie('session_token');
    if (!token) {
      setError('Unauthorized.');
      setLoading(false);
      return;
    }

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: '8',
      search,
      subject,
      teacher,
      type,
      sortBy
    });

    const cacheKey = `materials_cache_${queryParams.toString()}`;

    // 1. Try local storage cache for instant rendering
    if (useCache && typeof window !== 'undefined') {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setMaterials(parsed.data);
          setTotalPages(parsed.pagination?.totalPages || 1);
          setLoading(false);
          // Proactively refetch in background to update cache without visual delays
          fetchDataInBackground(token, queryParams, cacheKey);
          return;
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }
    }

    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/materials?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await res.json();

      if (payload.success) {
        setMaterials(payload.data);
        setTotalPages(payload.pagination?.totalPages || 1);
        setError('');
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify(payload));
      } else {
        setError(payload.message || 'Failed to load materials.');
      }
    } catch (e) {
      setError('Backend service connection failure.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDataInBackground = async (token: string, params: URLSearchParams, key: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/materials?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await res.json();
      if (payload.success) {
        setMaterials(payload.data);
        setTotalPages(payload.pagination?.totalPages || 1);
        localStorage.setItem(key, JSON.stringify(payload));
      }
    } catch (e) {
      console.error('Background fetch failed', e);
    }
  };

  useEffect(() => {
    loadMaterials(true);
  }, [page, subject, type, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadMaterials(false);
  };

  // Icon selector based on file type
  const getTypeIcon = (format: string) => {
    switch (format.toUpperCase()) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'DOC':
      case 'NOTES':
        return <Bookmark className="w-5 h-5 text-indigo-500" />;
      case 'PPT':
        return <File className="w-5 h-5 text-orange-500" />;
      case 'LINK':
      default:
        return <LinkIcon className="w-5 h-5 text-teal-600" />;
    }
  };

  const handleOpenMaterial = (material: Material) => {
    const url = material.fileUrl;
    
    // Open Links and PPTs directly in new tab
    if (material.type === 'LINK' || url.startsWith('http') && material.type !== 'PDF') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    // PDFs open in elegant built-in modal
    if (material.type === 'PDF') {
      setPreviewPdfUrl(url);
      return;
    }

    // Images open in lightweight lightbox
    if (url.match(/\.(jpeg|jpg|gif|png)$/i)) {
      setPreviewImageUrl(url);
      return;
    }

    // Standard fallback opens in new tab
    window.open(url, '_blank');
  };

  const subjectsList = ['Mathematics', 'Science', 'English', 'History', 'Computer Science', 'Physics', 'Chemistry'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Study Materials</h1>
          <p className="text-sm text-slate-500 mt-1">Access lecture notes, reference sheets, syllabus, and study resources.</p>
        </div>
        <button 
          onClick={() => loadMaterials(false)}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Sync
        </button>
      </div>

      {/* Lightweight search/filter dashboard section */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by material title..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          
          <input 
            type="text" 
            placeholder="Filter by teacher name..." 
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />

          <button 
            type="submit"
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Filter
          </button>
        </form>

        <div className="flex flex-wrap gap-3 items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex flex-wrap gap-2">
            <select 
              value={subject} 
              onChange={(e) => { setSubject(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
            >
              <option value="">All Subjects</option>
              {subjectsList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select 
              value={type} 
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
            >
              <option value="">All Formats</option>
              <option value="PDF">PDF Document</option>
              <option value="DOC">Word Document</option>
              <option value="PPT">PowerPoint</option>
              <option value="NOTES">Syllabus / Notes</option>
              <option value="LINK">External Link</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
            >
              <option value="latest">Uploaded: Latest</option>
              <option value="oldest">Uploaded: Oldest</option>
              <option value="subject">Subject</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs animate-pulse space-y-3">
              <div className="h-5 w-5 bg-slate-100 rounded"></div>
              <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
              <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">{error}</div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-3xs p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 text-slate-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Materials Found</h3>
          <p className="text-xs text-slate-400 mt-1">There are no study materials uploaded for the chosen filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {materials.map(material => (
            <div 
              key={material.id} 
              className="group bg-white p-4 rounded-2xl border border-slate-100/80 shadow-3xs hover:shadow-2xs hover:border-slate-200/50 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
                    {getTypeIcon(material.type)}
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                    {material.type}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-extrabold uppercase text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                    {material.subject}
                  </span>
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight leading-snug mt-1.5 group-hover:text-teal-950 transition-colors line-clamp-2" title={material.title}>
                    {material.title}
                  </h3>
                </div>

                <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-50 pt-2">
                  <div className="truncate">By {material.uploadedBy}</div>
                  <div>On {new Date(material.uploadDate).toLocaleDateString()}</div>
                  {material.fileSize && <div>Size: {material.fileSize}</div>}
                </div>
              </div>

              <div className="flex gap-1.5 pt-3 mt-3 border-t border-slate-50">
                <button 
                  onClick={() => handleOpenMaterial(material)}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3 text-slate-400" /> Open
                </button>
                <a 
                  href={material.fileUrl} 
                  download 
                  onClick={(e) => {
                    if (material.type === 'LINK') {
                      e.preventDefault();
                      window.open(material.fileUrl, '_blank');
                    }
                  }}
                  className="inline-flex items-center justify-center p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition-colors cursor-pointer"
                  title="Download File"
                >
                  {material.type === 'LINK' ? <ExternalLink className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF built-in viewer Modal */}
      {previewPdfUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-100">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-sm font-extrabold text-slate-800">Smart PDF Previewer</span>
              <button 
                onClick={() => setPreviewPdfUrl(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-slate-800">
              <iframe 
                src={`${previewPdfUrl}#toolbar=0`}
                className="w-full h-full border-none"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* Image preview modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50" onClick={() => setPreviewImageUrl(null)}>
          <div className="relative max-w-3xl max-h-[80vh] rounded-2xl overflow-hidden bg-white p-2">
            <button 
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900/60 text-white flex items-center justify-center hover:bg-slate-900 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img 
              src={previewImageUrl} 
              alt="Preview" 
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
