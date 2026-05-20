'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Copy, 
  Archive, 
  FilePlus2,
  Database,
  ArrowUpDown
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/teacher/ui/Base';

const questions = [
  {
    id: 1,
    title: "What is the derivative of sin(x)?",
    subject: "Mathematics",
    topic: "Calculus",
    marks: 2,
    difficulty: "Easy",
    type: "Objective",
    updatedAt: "2 days ago"
  },
  {
    id: 2,
    title: "Explain the process of photosynthesis in detail and its importance to the ecosystem.",
    subject: "Biology",
    topic: "Plant Physiology",
    marks: 10,
    difficulty: "Hard",
    type: "Subjective",
    updatedAt: "5 days ago"
  },
  {
    id: 3,
    title: "Solve for x: 2x + 5 = 15",
    subject: "Mathematics",
    topic: "Algebra",
    marks: 1,
    difficulty: "Easy",
    type: "Objective",
    updatedAt: "1 week ago"
  },
  {
    id: 4,
    title: "What are the laws of motion defined by Newton?",
    subject: "Physics",
    topic: "Mechanics",
    marks: 5,
    difficulty: "Medium",
    type: "Subjective",
    updatedAt: "3 days ago"
  },
  {
    id: 5,
    title: "Balance the following chemical equation: H2 + O2 -> H2O",
    subject: "Chemistry",
    topic: "Equations",
    marks: 3,
    difficulty: "Medium",
    type: "Objective",
    updatedAt: "1 day ago"
  }
];

export default function QuestionBank() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Question Bank</h1>
          <p className="text-gray-500 mt-1 font-medium">Manage and organize your reusable question repository.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 bg-white">
            <Database size={18} />
            Bulk Import
          </Button>
          <Button className="gap-2">
            <Plus size={18} />
            Add Question
          </Button>
        </div>
      </section>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by question title, topic or subject..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>All Subjects</option>
              <option>Mathematics</option>
              <option>Physics</option>
              <option>Chemistry</option>
              <option>Biology</option>
            </select>
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>All Difficulties</option>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>Question Type</option>
              <option>Objective</option>
              <option>Subjective</option>
            </select>
            <Button variant="outline" size="sm" className="gap-2 text-xs font-bold uppercase tracking-wider">
              <Filter size={14} />
              More Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <div className="flex items-center gap-4">
            <span className="w-8">#</span>
            <span>Question Details</span>
          </div>
          <div className="flex items-center gap-12 mr-32">
            <span className="w-24 flex items-center gap-1 cursor-pointer hover:text-gray-600">Marks <ArrowUpDown size={12}/></span>
            <span className="w-24 flex items-center gap-1 cursor-pointer hover:text-gray-600">Difficulty <ArrowUpDown size={12}/></span>
            <span className="w-24">Type</span>
          </div>
        </div>

        {questions.map((q, idx) => (
          <Card key={q.id} className="group hover:border-indigo-200 hover:shadow-md transition-all">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <span className="text-gray-400 font-medium w-8">{idx + 1}</span>
                <div className="max-w-2xl">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{q.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{q.subject}</span>
                    <span className="text-xs text-gray-400 font-medium">• {q.topic}</span>
                    <span className="text-xs text-gray-400 font-medium">• Updated {q.updatedAt}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <span className="w-24 text-sm font-bold text-gray-700">{q.marks} Marks</span>
                <div className="w-24">
                  <Badge variant={q.difficulty === 'Easy' ? 'success' : q.difficulty === 'Medium' ? 'warning' : 'error'}>
                    {q.difficulty}
                  </Badge>
                </div>
                <div className="w-24">
                  <Badge variant="info">{q.type}</Badge>
                </div>
                
                <div className="flex items-center gap-1">
                  <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Add to Paper">
                    <FilePlus2 size={18} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                    <Edit2 size={18} />
                  </button>
                  <div className="relative group/menu">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                      <MoreVertical size={18} />
                    </button>
                    {/* Hover menu - simplified */}
                    <div className="absolute right-0 top-full mt-1 hidden group-hover/menu:block bg-white border border-gray-200 rounded-lg shadow-xl z-10 w-40 overflow-hidden">
                      <button className="w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                        <Copy size={14} /> Duplicate
                      </button>
                      <button className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100">
                        <Archive size={14} /> Archive
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination Placeholder */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500 font-medium">Showing 1 to 5 of 124 questions</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm" className="bg-indigo-50 text-indigo-600 border-indigo-200">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );
}
