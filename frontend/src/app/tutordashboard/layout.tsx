import React from 'react';
import { TeacherSidebar, TeacherHeader } from '@/components/teacher/TeacherLayoutComponents';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <TeacherSidebar />
      <div className="flex-1 flex flex-col">
        <TeacherHeader />
        <main className="p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
