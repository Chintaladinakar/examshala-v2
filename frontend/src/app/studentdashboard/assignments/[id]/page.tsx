import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ExamEngineInteractive } from '@/components/student/ExamEngineInteractive';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MOCK_ASSIGNMENTS: Record<string, any> = {
  'math-final': {
    id: 'math-final',
    testTitle: 'Mathematics Term-End Assessment (Practice Mode)',
    duration: 90,
    assignedBy: 'Math Department',
    assignedByType: 'system',
    assignedAt: new Date().toISOString(),
    instructions: '1. This practice paper contains 5 questions.\n2. Each question carries 10 marks.\n3. Make sure to complete the exam in one sitting.\n4. Immersive mode/tab monitoring security is simulated.',
    isEligibleToStart: true,
  },
  'cs-mock': {
    id: 'cs-mock',
    testTitle: 'Computer Science Programming Lab Mock (Practice Mode)',
    duration: 60,
    assignedBy: 'CS Department',
    assignedByType: 'system',
    assignedAt: new Date().toISOString(),
    instructions: '1. This is a computer science mock test.\n2. Contains coding & analytical questions.\n3. Answer all questions to submit successfully.',
    isEligibleToStart: true,
  },
  'chem-practice': {
    id: 'chem-practice',
    testTitle: 'Organic Chemistry Practice Test',
    duration: 45,
    assignedBy: 'Chemistry Department',
    assignedByType: 'system',
    assignedAt: new Date().toISOString(),
    instructions: '1. Standard chemistry mock examination.\n2. Covers organic compounds, formulas, and reactions.\n3. Complete the quiz within 45 minutes.',
    isEligibleToStart: true,
  },
  'phys-mock': {
    id: 'phys-mock',
    testTitle: 'Physics Mechanics Mock Assessment (Practice Mode)',
    duration: 120,
    assignedBy: 'Physics Department',
    assignedByType: 'system',
    assignedAt: new Date().toISOString(),
    instructions: '1. High level physics dynamics practice exam.\n2. Ensure you have physical scratch papers to calculate answers.\n3. Duration: 120 minutes.',
    isEligibleToStart: true,
  }
};

export default async function ExamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // If requesting a mock/practice exam, render directly with local mock data
  if (MOCK_ASSIGNMENTS[id]) {
    return <ExamEngineInteractive assignment={MOCK_ASSIGNMENTS[id]} />;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  if (!token) {
    redirect('/signin');
  }

  let assignment = null;
  let authFailed = false;

  try {
    const response = await fetch(`http://localhost:5000/api/student/assignments/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) authFailed = true;
      else if (response.status === 404) return <ErrorState message="Assignment not found." />;
      else throw new Error('Failed to load instructions');
    } else {
      const payload = await response.json();
      assignment = payload.data;
    }
  } catch (error) {
    return <ErrorState message="Failed to connect to the backend server." />;
  }

  if (authFailed) {
    redirect('/signin');
  }

  if (!assignment) return <ErrorState message="Assignment data is missing." />;

  return <ExamEngineInteractive assignment={assignment} />;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
      <h2 className="text-xl font-bold text-slate-700 mb-2">Error</h2>
      <p className="text-slate-500">{message}</p>
      <Link href="/studentdashboard" className="mt-6 px-6 py-2 bg-slate-100 font-medium rounded-lg hover:bg-slate-200 transition-colors text-slate-700">
        Return Home
      </Link>
    </div>
  );
}
