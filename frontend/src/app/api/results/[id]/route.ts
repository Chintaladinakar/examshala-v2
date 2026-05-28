import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const mockResults = [
  {
    id: "mock-1",
    subject: "Mathematics",
    score: 85,
    totalMarks: 100,
    percentage: 85.0,
    grade: "A",
    status: "Passed",
    rank: 4,
    feedback: "Excellent work on trigonometry and calculus theorems.",
    createdAt: new Date('2026-05-10T10:00:00Z').toISOString()
  },
  {
    id: "mock-2",
    subject: "Physics",
    score: 94,
    totalMarks: 100,
    percentage: 94.0,
    grade: "A+",
    status: "Passed",
    rank: 1,
    feedback: "Exceptional visual problem solving in mechanics.",
    createdAt: new Date('2026-05-15T14:30:00Z').toISOString()
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await prisma.result.findUnique({
      where: { id },
    });

    if (!result) {
      // Fallback lookup in seeded mock results
      const mockMatch = mockResults.find(m => m.id === id);
      if (mockMatch) {
        return NextResponse.json({
          success: true,
          data: mockMatch,
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Result not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[API_RESULT_BY_ID_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch result by ID',
      },
      { status: 500 }
    );
  }
}
