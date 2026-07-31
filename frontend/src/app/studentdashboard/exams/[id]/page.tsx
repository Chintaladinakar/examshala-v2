'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ExamEngineInteractive } from '@/components/student/ExamEngineInteractive';

const MOCK_EXAMS: Record<string, any> = {
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

export default function StudentExamTakingPage() {
  const params = useParams();
  const id = params.id as string;

  const [examData, setExamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (MOCK_EXAMS[id]) {
        setExamData(MOCK_EXAMS[id]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Goes through the authenticated same-origin proxy, which forwards the HttpOnly
        // session cookie to the backend server-side.
        const examRes = await fetch(`/api/proxy/api/student/assignments/${id}`);
        const examPayload = await examRes.json();

        if (examRes.status === 401) {
          setError('Session expired. Please log in.');
          setLoading(false);
          return;
        }

        if (examPayload.success) {
          setExamData(examPayload.data);
          setError('');
        } else {
          setError('Exam or assessment details not found.');
        }
      } catch (e) {
        setError('Connection error. Could not contact assessment engine API.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 animate-pulse select-none">
        <div className="space-y-4 text-center max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-100/80 border border-teal-200/50 mx-auto animate-spin flex items-center justify-center">
            <span className="text-teal-600 text-sm">⏳</span>
          </div>
          <div className="h-5 w-40 bg-slate-200 rounded-md mx-auto"></div>
          <div className="h-3 w-56 bg-slate-100 rounded-md mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !examData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-550">
            ⚠️
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800">Error Loading Assessment</h2>
            <p className="text-xs text-slate-400 leading-relaxed">{error || 'Unable to retrieve exam configuration.'}</p>
          </div>
          <Link href="/studentdashboard/exams" className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return to Exams List
          </Link>
        </div>
      </div>
    );
  }

  return <ExamEngineInteractive assignment={examData} />;
}
