'use client';

import { useParams } from 'next/navigation';
import { ExamAttemptRunner } from '@/components/student/ExamAttemptRunner';

export default function LiveExamPage() {
  const params = useParams();
  const id = params.id as string;
  return <ExamAttemptRunner examId={id} />;
}
