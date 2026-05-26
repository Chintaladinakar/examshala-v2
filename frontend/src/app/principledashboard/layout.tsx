import { redirect } from 'next/navigation';
import { requireSchoolAuth } from '@/lib/school/authz';
import { Navbar } from '@/components/school/Navbar';

export default async function PrincipalDashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireSchoolAuth().catch(() => null);
  if (!ctx) redirect('/signin');

  if (ctx.role !== 'principal') redirect('/tutordashboard');
  if (ctx.mode !== 'principal') redirect('/tutordashboard');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      {children}
    </div>
  );
}

