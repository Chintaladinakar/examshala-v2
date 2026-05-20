'use client';

import React from 'react';
import { 
  Plus, 
  FileText, 
  Eye, 
  Share2, 
  Copy, 
  Trash2, 
  Calendar,
  Users,
  Search,
  Filter,
  Sparkles
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/teacher/ui/Base';
import { tutorPapersMock } from '@/lib/mock/tutorDashboardMock';

export default function QuestionPapers() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Question Papers</h1>
          <p className="text-gray-500 mt-1 font-medium">Create and manage assessment papers from your question bank.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50">
            <Sparkles size={18} />
            AI Generator
          </Button>
          <Button className="gap-2">
            <Plus size={18} />
            Create New Paper
          </Button>
        </div>
      </section>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-2 rounded-xl border border-gray-200">
        <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg w-full md:w-auto">
          {['All Papers', 'Drafts', 'Published', 'Archived'].map((tab, idx) => (
            <button
              key={tab}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                idx === 0 ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto px-2">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search papers..."
              className="w-full pl-9 pr-4 py-1.5 border-none bg-transparent text-sm focus:ring-0"
            />
          </div>
          <Button variant="ghost" size="sm" className="gap-2 text-xs uppercase font-bold text-gray-500">
            <Filter size={14} />
            Filter
          </Button>
        </div>
      </div>

      {/* Papers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tutorPapersMock.map((paper) => (
          <Card key={paper.id} className="group flex flex-col border-2 border-transparent hover:border-indigo-100 transition-all hover:shadow-xl">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FileText size={24} />
                </div>
                <Badge variant={paper.status === 'Published' ? 'success' : paper.status === 'Draft' ? 'warning' : 'neutral'}>
                  {paper.status}
                </Badge>
              </div>

              <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2 line-clamp-1">
                {paper.title}
              </h3>
              
              <div className="flex flex-wrap gap-y-3 mt-4">
                <div className="w-1/2 flex items-center gap-2 text-xs font-medium text-gray-500">
                  <span className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-gray-400">
                    <Users size={12} />
                  </span>
                  {paper.class}
                </div>
                <div className="w-1/2 flex items-center gap-2 text-xs font-medium text-gray-500">
                  <span className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-gray-400">
                    <Sparkles size={12} />
                  </span>
                  {paper.subject}
                </div>
                <div className="w-1/2 flex items-center gap-2 text-xs font-medium text-gray-500">
                  <span className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-gray-400">
                    <Calendar size={12} />
                  </span>
                  {paper.duration}
                </div>
                <div className="w-1/2 flex items-center gap-2 text-xs font-medium text-gray-500">
                  <span className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-gray-400 font-bold">
                    Q
                  </span>
                  {paper.questions} Questions
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Total Marks</p>
                  <p className="text-xl font-bold text-gray-900">{paper.marks}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Preview">
                    <Eye size={18} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Assign">
                    <Share2 size={18} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Duplicate">
                    <Copy size={18} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
            
            {paper.status === 'Published' && (
              <div className="px-6 py-3 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest flex items-center justify-between border-t border-emerald-100">
                <span>Active Assessment</span>
                <span>45 Submissions</span>
              </div>
            )}
          </Card>
        ))}

        {/* Create Card */}
        <button className="flex flex-col items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl hover:bg-white hover:border-indigo-300 transition-all group min-h-[320px]">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform mb-4">
            <Plus size={32} className="text-gray-400 group-hover:text-indigo-600" />
          </div>
          <p className="font-bold text-gray-900">Create New Paper</p>
          <p className="text-xs text-gray-400 mt-1">Manual or AI-assisted generation</p>
        </button>
      </div>
    </div>
  );
}
