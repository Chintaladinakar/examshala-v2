import { redirect } from 'next/navigation';
import { requireSchoolAuth } from '@/lib/school/authz';
import { Navbar } from '@/components/school/Navbar';

export default async function TutorDashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireSchoolAuth().catch(() => null);
  if (!ctx) redirect('/signin');

  if (ctx.mode !== 'teacher') redirect('/principledashboard');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      {children}
    </div>
  );
}
