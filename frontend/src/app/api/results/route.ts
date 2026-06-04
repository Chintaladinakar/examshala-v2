import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwtPayload } from '@/lib/auth';
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

export async function GET() {
  try {
    const results = await prisma.result.findMany({
      include: {
        student: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        data: mockResults,
      });
    }

    const formattedResults = results.map(r => ({
      ...r,
      studentName: r.student?.name || 'Unknown Student',
      studentEmail: r.student?.email || '',
    }));

    return NextResponse.json({
      success: true,
      data: formattedResults,
    });
  } catch (error: any) {
    console.error('[API_RESULTS_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch results',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const decoded = decodeJwtPayload(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid session payload.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { examId, subject, score, totalMarks, percentage, grade, status, feedback, timeTaken } = body;

    if (!subject || score === undefined || !totalMarks) {
      return NextResponse.json(
        { success: false, error: 'Missing required results fields.' },
        { status: 400 }
      );
    }

    const newResult = await prisma.result.create({
      data: {
        studentId: decoded.userId,
        examId: examId || 'custom-exam',
        subject,
        score: parseInt(score, 10) || 0,
        totalMarks: parseInt(totalMarks, 10) || 100,
        percentage: parseFloat(percentage) || 0.0,
        grade: grade || 'A',
        status: status || 'Passed',
        feedback: feedback || 'Assessment completed successfully.',
        timeTaken: timeTaken ? parseInt(timeTaken, 10) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: newResult,
    }, { status: 201 });

  } catch (error: any) {
    console.error('[API_RESULTS_POST_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to submit test results',
      },
      { status: 500 }
    );
  }
}

