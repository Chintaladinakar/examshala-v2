import { redirect } from 'next/navigation';
import { requireSchoolAuth } from '@/lib/school/authz';

export default async function PrincipalDashboardLayout({ children }: { children: React.ReactNode }) {
  try {
    const ctx = await requireSchoolAuth();
    if (ctx.role !== 'principal') redirect('/tutordashboard');
    return (
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    );
  } catch (err: any) {
    if (err?.message === 'NO_WORKSPACE') {
      redirect('/workspace/onboarding');
    }
    // Log the error for debugging
    console.error('[auth-error]', err?.message || err);
    redirect('/signin?error=unauthorized');
  }
}

