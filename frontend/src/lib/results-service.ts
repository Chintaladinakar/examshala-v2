import { prisma } from '@/lib/prisma';

export function calculateAverageScore(attempts: any[]): number {
  if (attempts.length === 0) return 0;
  const sum = attempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
  return Math.round((sum / attempts.length) * 10) / 10;
}

export function getHighestScore(attempts: any[]): number {
  if (attempts.length === 0) return 0;
  return Math.max(...attempts.map(a => a.percentage || 0));
}

export function getTimelinePerformance(attempts: any[]) {
  // Return chronological exam performance (sorted by submittedAt ascending)
  return [...attempts]
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
    .map(a => ({
      examName: a.assessment?.title || 'Assessment',
      percentage: a.percentage,
      submittedAt: a.submittedAt.toISOString()
    }));
}

export function getRecentResults(attempts: any[]) {
  // Latest attempted exams sorted by submittedAt DESC (attempts array is already sorted DESC by DB query)
  return attempts.map(a => ({
    id: a.id,
    examName: a.assessment?.title || 'Assessment',
    subject: a.assessment?.subject || 'N/A',
    score: a.obtainedMarks,
    totalMarks: a.totalMarks,
    percentage: a.percentage,
    rank: a.rank,
    submittedAt: a.submittedAt.toISOString(),
    status: a.status
  }));
}

export async function getStudentResults(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (!student) {
    return null; // Return null to indicate student profile not found (will yield 404)
  }

  const attempts = await prisma.assessmentAttempt.findMany({
    where: {
      profileStudentId: student.id,
      status: 'COMPLETED'
    },
    select: {
      id: true,
      obtainedMarks: true,
      totalMarks: true,
      percentage: true,
      rank: true,
      status: true,
      submittedAt: true,
      assessment: {
        select: {
          title: true,
          subject: true
        }
      }
    },
    orderBy: {
      submittedAt: 'desc'
    }
  });

  if (attempts.length === 0) {
    return {
      stats: {
        averageScore: 0,
        highestScore: 0,
        examsCompleted: 0,
        currentRank: null
      },
      timelinePerformance: [],
      recentResults: []
    };
  }

  const averageScore = calculateAverageScore(attempts);
  const highestScore = getHighestScore(attempts);
  const examsCompleted = attempts.length;
  // Current rank: Latest available rank (since attempts is sorted by submittedAt desc, first element is latest)
  const currentRank = attempts[0].rank;

  const timelinePerformance = getTimelinePerformance(attempts);
  const recentResults = getRecentResults(attempts);

  return {
    stats: {
      averageScore,
      highestScore,
      examsCompleted,
      currentRank
    },
    timelinePerformance,
    recentResults
  };
}
