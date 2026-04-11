import React from 'react';
import { Sidebar } from '@/components/student/Sidebar';
import { Header } from '@/components/student/Header';

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-[#FBFBFB] min-h-screen text-slate-800 font-sans selection:bg-teal-100 selection:text-teal-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
