import { redirect } from 'next/navigation';
import { requireSchoolAuth } from '@/lib/school/authz';

export default async function TutorDashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    const ctx = await requireSchoolAuth();
    if (ctx.mode !== 'teacher') redirect('/principledashboard');
    return (
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    );
  } catch (err: any) {
    if (err?.message === 'NO_WORKSPACE') {
      redirect('/workspace/onboarding');
    }
    redirect('/signin?error=unauthorized');
  }
}
