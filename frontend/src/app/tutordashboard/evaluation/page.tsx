'use client';

import React from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  GraduationCap,
  BookOpen,
  ArrowRight,
  User
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/teacher/ui/Base';

const submissions = [
  {
    id: 1,
    student: "John Doe",
    test: "Mathematics Mid-Term",
    class: "Grade 10-A",
    status: "Pending",
    autoScore: "35/50",
    submittedAt: "2 hours ago",
    avatar: "https://ui-avatars.com/api/?name=John+Doe&background=random"
  },
  {
    id: 2,
    student: "Jane Smith",
    test: "Mathematics Mid-Term",
    class: "Grade 10-A",
    status: "Completed",
    totalScore: "88/100",
    submittedAt: "5 hours ago",
    avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=random"
  },
  {
    id: 3,
    student: "Robert Brown",
    test: "Physics Quiz 1",
    class: "Grade 9-B",
    status: "Pending",
    autoScore: "12/15",
    submittedAt: "1 day ago",
    avatar: "https://ui-avatars.com/api/?name=Robert+Brown&background=random"
  },
  {
    id: 4,
    student: "Emily White",
    test: "Physics Quiz 1",
    class: "Grade 9-B",
    status: "Completed",
    totalScore: "18/20",
    submittedAt: "1 day ago",
    avatar: "https://ui-avatars.com/api/?name=Emily+White&background=random"
  },
  {
    id: 5,
    student: "Michael Ross",
    test: "Chemistry Lab Report",
    class: "Grade 12-C",
    status: "Needs Review",
    autoScore: "0/0",
    submittedAt: "3 days ago",
    avatar: "https://ui-avatars.com/api/?name=Michael+Ross&background=random"
  }
];

export default function Evaluation() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Evaluation</h1>
          <p className="text-gray-500 mt-1 font-medium">Review and grade student submissions for your assessments.</p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="flex items-center gap-4 px-4 py-2 border-amber-100 bg-amber-50 shadow-none">
            <AlertCircle size={20} className="text-amber-600" />
            <div>
              <p className="text-xs font-bold text-amber-900 uppercase tracking-tight leading-none">Pending</p>
              <p className="text-xl font-bold text-amber-600 leading-none mt-1">24</p>
            </div>
          </Card>
          <Button className="gap-2">
            Start Grading
            <ArrowRight size={18} />
          </Button>
        </div>
      </section>

      {/* Stats & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Quick Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Subject</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option>All Subjects</option>
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Test Name</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option>All Assessments</option>
                  <option>Mathematics Mid-Term</option>
                  <option>Physics Quiz 1</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Status</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-gray-300" defaultChecked />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">Pending Review</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-gray-300" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">Completed</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-gray-300" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">Needs Review</span>
                  </label>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-6 text-xs uppercase font-bold tracking-widest">
              Reset Filters
            </Button>
          </Card>

          <Card className="p-6 bg-indigo-600 text-white border-none">
            <h3 className="font-bold flex items-center gap-2 mb-2">
              <GraduationCap size={20} />
              Pro Tip
            </h3>
            <p className="text-xs text-indigo-100 font-medium leading-relaxed">
              Objective questions are automatically scored. Focus on the subjective parts to speed up your workflow.
            </p>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {/* Submission List Header */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name or ID..."
                className="w-full pl-10 pr-4 py-2 border-none bg-transparent text-sm focus:ring-0"
              />
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span>Sort by: Date Submitted</span>
            </div>
          </div>

          {/* Submission Cards */}
          <div className="space-y-3">
            {submissions.map((sub) => (
              <Card key={sub.id} className="group hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer overflow-visible">
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={sub.avatar} alt={sub.student} className="w-12 h-12 rounded-full border border-gray-100" />
                      {sub.status === 'Completed' ? (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        </div>
                      ) : (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                          <Clock size={16} className="text-amber-500" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{sub.student}</h4>
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-2 mt-1">
                        <BookOpen size={10} />
                        {sub.test} • {sub.class}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-x-8 gap-y-4">
                    <div className="min-w-[100px]">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Status</p>
                      <Badge variant={sub.status === 'Completed' ? 'success' : sub.status === 'Pending' ? 'warning' : 'error'}>
                        {sub.status}
                      </Badge>
                    </div>
                    <div className="min-w-[100px]">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Auto Score</p>
                      <p className="text-sm font-bold text-gray-900">{sub.autoScore || '-'}</p>
                    </div>
                    <div className="min-w-[100px]">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Submitted</p>
                      <p className="text-sm font-medium text-gray-500">{sub.submittedAt}</p>
                    </div>
                    
                    {sub.status === 'Completed' ? (
                      <div className="min-w-[80px] text-right">
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Total</p>
                        <p className="text-lg font-bold text-indigo-600">{sub.totalScore}</p>
                      </div>
                    ) : (
                      <Button variant="secondary" size="sm" className="gap-2 text-xs">
                        Review
                        <ChevronRight size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button variant="outline" className="w-full text-sm font-bold uppercase tracking-widest py-3 border-dashed bg-gray-50/50 hover:bg-white hover:border-indigo-300">
            Load More Submissions
          </Button>
        </div>
      </div>
    </div>
  );
}
