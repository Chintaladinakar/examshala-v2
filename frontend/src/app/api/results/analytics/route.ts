import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const results = await prisma.result.findMany({});
    
    if (results.length === 0) {
      // Mocked fallback analytics
      return NextResponse.json({
        success: true,
        data: {
          averageScore: 89.5,
          highestScore: 94.0,
          examsCompleted: 2,
          currentRank: 1
        }
      });
    }

    const totalPercentage = results.reduce((acc, r) => acc + r.percentage, 0);
    const averageScore = Math.round((totalPercentage / results.length) * 10) / 10;
    const highestScore = Math.max(...results.map(r => r.percentage));
    const examsCompleted = results.length;
    
    // Sort chronologically desc to find the current rank (latest attempted rank)
    const sortedDesc = [...results].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const currentRank = sortedDesc[0]?.rank || null;

    return NextResponse.json({
      success: true,
      data: {
        averageScore,
        highestScore,
        examsCompleted,
        currentRank
      }
    });
  } catch (error: any) {
    console.error('[API_RESULTS_ANALYTICS_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch analytics',
      },
      { status: 500 }
    );
  }
}
