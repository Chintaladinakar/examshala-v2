'use client';

import React from 'react';
import { 
  BarChart3, 
  Send, 
  Settings2, 
  Download, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileSpreadsheet,
  Users,
  Search
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/teacher/ui/Base';

const testResults = [
  {
    id: 1,
    title: "Mathematics Mid-Term",
    class: "Grade 10-A",
    averageScore: "72%",
    highestScore: "98%",
    lowestScore: "45%",
    evaluated: "45/45",
    status: "Published",
    publishingMode: "Manual",
    lastUpdated: "2 days ago"
  },
  {
    id: 2,
    title: "Physics Quiz 1",
    class: "Grade 9-B",
    averageScore: "85%",
    highestScore: "100%",
    lowestScore: "60%",
    evaluated: "32/32",
    status: "Ready to Publish",
    publishingMode: "Auto",
    lastUpdated: "5 hours ago"
  },
  {
    id: 3,
    title: "Chemistry Unit Test",
    class: "Grade 12-C",
    averageScore: "-",
    highestScore: "-",
    lowestScore: "-",
    evaluated: "12/40",
    status: "Evaluating",
    publishingMode: "Manual",
    lastUpdated: "1 day ago"
  },
  {
    id: 4,
    title: "English Essay Writing",
    class: "Grade 11-A",
    averageScore: "68%",
    highestScore: "92%",
    lowestScore: "40%",
    evaluated: "28/28",
    status: "Draft",
    publishingMode: "Manual",
    lastUpdated: "1 week ago"
  }
];

export default function Results() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Results Publishing</h1>
          <p className="text-gray-500 mt-1 font-medium">Control when and how students see their assessment performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 bg-white">
            <Download size={18} />
            Bulk Export
          </Button>
          <Button variant="outline" className="gap-2 bg-white">
            <Settings2 size={18} />
            Global Settings
          </Button>
        </div>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-emerald-100 bg-emerald-50/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Published Tests</p>
              <h3 className="text-3xl font-bold text-emerald-600 mt-1">12</h3>
            </div>
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <p className="text-xs text-emerald-700 mt-4 font-medium">85% total engagement this term</p>
        </Card>
        <Card className="p-6 border-indigo-100 bg-indigo-50/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-indigo-800 uppercase tracking-widest">Ready to Release</p>
              <h3 className="text-3xl font-bold text-indigo-600 mt-1">3</h3>
            </div>
            <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
              <Send size={24} />
            </div>
          </div>
          <p className="text-xs text-indigo-700 mt-4 font-medium">Click to notify students immediately</p>
        </Card>
        <Card className="p-6 border-amber-100 bg-amber-50/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">In Progress</p>
              <h3 className="text-3xl font-bold text-amber-600 mt-1">5</h3>
            </div>
            <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
              <Clock size={24} />
            </div>
          </div>
          <p className="text-xs text-amber-700 mt-4 font-medium">Evaluation pending for 48 students</p>
        </Card>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tests or classes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>All Classes</option>
              <option>Grade 10</option>
              <option>Grade 9</option>
            </select>
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>Publishing Mode</option>
              <option>Auto</option>
              <option>Manual</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Test Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Evaluated</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Avg. Score</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Stats (H/L)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {testResults.map((test) => (
                <tr key={test.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <BarChart3 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-none">{test.title}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">{test.class} • {test.publishingMode} Publish</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <span>{test.evaluated}</span>
                        <span>{Math.round((parseInt(test.evaluated.split('/')[0]) / parseInt(test.evaluated.split('/')[1])) * 100)}%</span>
                      </div>
                      <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            test.status === 'Published' ? 'bg-emerald-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${(parseInt(test.evaluated.split('/')[0]) / parseInt(test.evaluated.split('/')[1])) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`text-sm font-bold ${test.averageScore === '-' ? 'text-gray-300' : 'text-indigo-600'}`}>
                      {test.averageScore}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">{test.highestScore}</span>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1 rounded">{test.lowestScore}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={
                      test.status === 'Published' ? 'success' : 
                      test.status === 'Ready to Publish' ? 'info' : 
                      test.status === 'Evaluating' ? 'warning' : 'neutral'
                    }>
                      {test.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="px-2">
                        <Eye size={16} />
                      </Button>
                      <Button variant="outline" size="sm" className="px-2">
                        <FileSpreadsheet size={16} />
                      </Button>
                      {test.status === 'Ready to Publish' && (
                        <Button size="sm" className="gap-2 text-xs font-bold py-1.5 px-3">
                          <Send size={14} />
                          Publish
                        </Button>
                      )}
                      {test.status === 'Published' && (
                        <Button variant="ghost" size="sm" className="text-emerald-600 font-bold text-xs uppercase tracking-widest px-2">
                          Analytics
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
