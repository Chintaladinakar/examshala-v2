'use client';

import React from 'react';
import { 
  Plus, 
  FilePlus, 
  FileText,
  PlayCircle, 
  CheckCircle2, 
  ClipboardCheck,
  Calendar,
  Clock,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/teacher/ui/Base';
import Link from 'next/link';

export default function TeacherDashboard() {
  const teacherName = "Sarah Jenkins";

  const stats = [
    { label: "Pending Evaluations", value: "14", trend: "+2 today", color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Active Classes", value: "6", trend: "Normal", color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Upcoming Tests", value: "3", trend: "This week", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Average Class Perf.", value: "78%", trend: "+5%", color: "text-blue-600", bg: "bg-blue-50" },
  ];

  const quickActions = [
    { label: "Create Question", icon: Plus, color: "bg-indigo-600", href: "/tutordashboard/questions" },
    { label: "Create Paper", icon: FilePlus, color: "bg-emerald-600", href: "/tutordashboard/papers" },
    { label: "Start Evaluation", icon: PlayCircle, color: "bg-amber-600", href: "/tutordashboard/evaluation" },
    { label: "Publish Results", icon: CheckCircle2, color: "bg-blue-600", href: "/tutordashboard/results" },
    { label: "Add Assignment", icon: ClipboardCheck, color: "bg-purple-600", href: "/tutordashboard/assignments" },
  ];

  const schedule = [
    { time: "09:00 AM", class: "Grade 10 - Mathematics", room: "Room 102", type: "Class" },
    { time: "11:30 AM", class: "Grade 9 - Physics Lab", room: "Lab B", type: "Lab" },
    { time: "02:00 PM", class: "Grade 11 - Advanced Algebra", room: "Room 205", type: "Class" },
  ];

  const recentPapers = [
    { title: "Calculus Mid-Term", subject: "Maths", class: "Grade 12", date: "24 Oct 2023", status: "Published" },
    { title: "Kinematics Quiz", subject: "Physics", class: "Grade 10", date: "26 Oct 2023", status: "Draft" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back, {teacherName}</h1>
          <p className="text-gray-500 mt-1 font-medium">Here's what's happening in your classes today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 bg-white">
            <Calendar size={18} />
            View Schedule
          </Button>
          <Button className="gap-2">
            <Plus size={18} />
            New Assessment
          </Button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-6">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
              <span className="text-xs font-medium text-gray-400">{stat.trend}</span>
            </div>
            <div className={`mt-4 h-1 w-full rounded-full ${stat.bg}`}>
              <div className={`h-full rounded-full ${stat.color.replace('text', 'bg')} w-2/3 opacity-30`}></div>
            </div>
          </Card>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Flow */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {quickActions.map((action, idx) => (
                <Link key={idx} href={action.href}>
                  <div className="group flex flex-col items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
                    <div className={`${action.color} text-white p-3 rounded-lg shadow-sm group-hover:scale-110 transition-transform`}>
                      <action.icon size={24} />
                    </div>
                    <span className="text-xs font-bold text-gray-700 text-center uppercase tracking-tight">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Pending Evaluations & Result Status */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Recent Question Papers</h3>
                <Link href="/tutordashboard/papers" className="text-xs font-bold text-indigo-600 hover:underline">View All</Link>
              </div>
              <div className="p-4 space-y-3">
                {recentPapers.map((paper, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{paper.title}</p>
                        <p className="text-xs text-gray-500 font-medium">{paper.subject} • {paper.class}</p>
                      </div>
                    </div>
                    <Badge variant={paper.status === 'Published' ? 'success' : 'neutral'}>{paper.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Result Status</h3>
                <Link href="/tutordashboard/results" className="text-xs font-bold text-indigo-600 hover:underline">View All</Link>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                    <span>Trigonometry Quiz</span>
                    <span className="text-indigo-600">85% Evaluated</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[85%] rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                    <span>Algebra Basics</span>
                    <span className="text-emerald-600">Ready to Publish</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="mt-auto p-4 pt-0">
                <Button variant="secondary" className="w-full text-xs py-2">
                  Verify All Evaluations
                </Button>
              </div>
            </Card>
          </section>
        </div>

        {/* Right Column - Sidebars */}
        <div className="space-y-8">
          {/* Today's Schedule */}
          <Card className="overflow-hidden">
            <div className="bg-indigo-600 p-6 text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Clock size={20} />
                Today's Schedule
              </h3>
              <p className="text-indigo-100 text-sm mt-1">Wednesday, 28 Oct</p>
            </div>
            <div className="p-6 space-y-6">
              {schedule.map((item, idx) => (
                <div key={idx} className="relative pl-6 border-l-2 border-indigo-100 last:border-0 pb-6 last:pb-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-indigo-600 rounded-full"></div>
                  <p className="text-xs font-bold text-indigo-600">{item.time}</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{item.class}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1">
                      <GraduationCap size={14} />
                      {item.room}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-md">{item.type}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100">
              <Button variant="ghost" className="w-full gap-2 text-xs">
                View Full Calendar
                <ArrowRight size={14} />
              </Button>
            </div>
          </Card>

          {/* Upcoming Classes */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 mb-4">Upcoming Classes</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex flex-col items-center justify-center text-indigo-600 leading-none">
                  <span className="text-[10px] font-bold uppercase">Oct</span>
                  <span className="text-sm font-bold">29</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Mechanics 101</p>
                  <p className="text-xs text-gray-500">08:00 AM • Grade 11</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex flex-col items-center justify-center text-indigo-600 leading-none">
                  <span className="text-[10px] font-bold uppercase">Oct</span>
                  <span className="text-sm font-bold">30</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Modern History</p>
                  <p className="text-xs text-gray-500">10:30 AM • Grade 9</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
