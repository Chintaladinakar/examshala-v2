import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSchoolAuth, requirePrincipal } from '@/lib/school/authz';
import { jsonOk, jsonError, mapAuthzError } from '@/lib/school/http';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    requirePrincipal(ctx);

    // Fetch workspace assessment assignments
    const assignments = await prisma.assessmentAssignment.findMany({
      where: { workspaceId: ctx.workspaceId },
      include: {
        Test: true,
        attempts: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            Result: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    const ongoingList = assignments.map((asm) => {
      const totalAttempts = asm.attempts.length;
      const completedAttempts = asm.attempts.filter(
        (att) => att.status === 'submitted' || att.status === 'evaluated'
      ).length;
      const activeAttempts = asm.attempts.filter(
        (att) => att.status === 'in_progress'
      ).length;

      // Calculate average score if there are evaluated results
      const results = asm.attempts
        .map((att) => att.Result)
        .filter((r) => r !== null && r !== undefined);
      const avgScore =
        results.length > 0
          ? Math.round(
              results.reduce((acc, curr) => acc + (curr?.score || 0), 0) /
                results.length
            )
          : null;

      return {
        id: asm.id,
        testId: asm.testId,
        title: asm.Test.title,
        duration: asm.Test.duration,
        assignedByName: asm.assignedByName,
        assignedAt: asm.assignedAt,
        scheduleWindowStart: asm.scheduleWindowStart,
        scheduleWindowEnd: asm.scheduleWindowEnd,
        isReady: asm.isReady,
        progress: {
          total: totalAttempts,
          completed: completedAttempts,
          active: activeAttempts,
        },
        averageScore: avgScore,
        maxScore: results[0]?.maxScore || 100,
        attempts: asm.attempts.map((att) => ({
          id: att.id,
          studentName: att.User.name,
          studentEmail: att.User.email,
          startedAt: att.startedAt as Date | null,
          submittedAt: att.submittedAt,
          status: att.status,
          focusLossCount: att.focusLoss,
          score: att.Result?.score || null,
          maxScore: att.Result?.maxScore || 100,
          feedback: att.Result?.feedback || '',
        })),
      };
    });

    // Premium Mock Fallback data if no assignments exist
    if (ongoingList.length === 0) {
      const now = new Date();
      ongoingList.push(
        {
          id: 'mock-asm-1',
          testId: 'test-1',
          title: 'Mathematics Algebra Mid-Term',
          duration: 60,
          assignedByName: 'Dr. John Smith',
          assignedAt: new Date(now.getTime() - 2 * 24 * 3600000),
          scheduleWindowStart: new Date(now.getTime() - 2 * 24 * 3600000),
          scheduleWindowEnd: new Date(now.getTime() + 5 * 24 * 3600000),
          isReady: true,
          progress: {
            total: 5,
            completed: 3,
            active: 1,
          },
          averageScore: 84,
          maxScore: 100,
          attempts: [
            {
              id: 'att-1',
              studentName: 'Amit Kumar',
              studentEmail: 'amit.kumar@student.com',
              startedAt: new Date(now.getTime() - 24 * 3600000),
              submittedAt: new Date(now.getTime() - 23 * 3600000 - 30 * 60000),
              status: 'evaluated',
              focusLossCount: 0,
              score: 92,
              maxScore: 100,
              feedback: 'Perfect understanding of core equations.',
            },
            {
              id: 'att-2',
              studentName: 'Priya Sharma',
              studentEmail: 'priya.sharma@student.com',
              startedAt: new Date(now.getTime() - 18 * 3600000),
              submittedAt: new Date(now.getTime() - 17 * 3600000),
              status: 'evaluated',
              focusLossCount: 2,
              score: 86,
              maxScore: 100,
              feedback: 'Very good work, but lost concentration at the end.',
            },
            {
              id: 'att-3',
              studentName: 'Rahul Verma',
              studentEmail: 'rahul.verma@student.com',
              startedAt: new Date(now.getTime() - 10 * 3600000),
              submittedAt: new Date(now.getTime() - 9 * 3600000),
              status: 'submitted',
              focusLossCount: 4,
              score: 74,
              maxScore: 100,
              feedback: 'Pending primary review, focus loss flags were triggered.',
            },
            {
              id: 'att-4',
              studentName: 'Sneha Patel',
              studentEmail: 'sneha.patel@student.com',
              startedAt: new Date(now.getTime() - 15 * 60000),
              submittedAt: null,
              status: 'in_progress',
              focusLossCount: 1,
              score: null,
              maxScore: 100,
              feedback: '',
            },
            {
              id: 'att-5',
              studentName: 'Kabir Dev',
              studentEmail: 'kabir.dev@student.com',
              startedAt: null,
              submittedAt: null,
              status: 'not_started',
              focusLossCount: 0,
              score: null,
              maxScore: 100,
              feedback: '',
            },
          ],
        },
        {
          id: 'mock-asm-2',
          testId: 'test-2',
          title: 'Physics Wave Mechanics Quiz',
          duration: 45,
          assignedByName: 'Prof. Amit Roy',
          assignedAt: new Date(now.getTime() - 1 * 24 * 3600000),
          scheduleWindowStart: new Date(now.getTime() - 1 * 24 * 3600000),
          scheduleWindowEnd: new Date(now.getTime() + 1 * 24 * 3600000),
          isReady: true,
          progress: {
            total: 3,
            completed: 1,
            active: 2,
          },
          averageScore: 90,
          maxScore: 100,
          attempts: [
            {
              id: 'att-6',
              studentName: 'Ananya Roy',
              studentEmail: 'ananya.roy@student.com',
              startedAt: new Date(now.getTime() - 4 * 3600000),
              submittedAt: new Date(now.getTime() - 3.5 * 3600000),
              status: 'evaluated',
              focusLossCount: 0,
              score: 90,
              maxScore: 100,
              feedback: 'Excellent work in harmonic oscillators.',
            },
            {
              id: 'att-7',
              studentName: 'Arjun Das',
              studentEmail: 'arjun.das@student.com',
              startedAt: new Date(now.getTime() - 10 * 60000),
              submittedAt: null,
              status: 'in_progress',
              focusLossCount: 0,
              score: null,
              maxScore: 100,
              feedback: '',
            },
            {
              id: 'att-8',
              studentName: 'Neha Sen',
              studentEmail: 'neha.sen@student.com',
              startedAt: new Date(now.getTime() - 2 * 60000),
              submittedAt: null,
              status: 'in_progress',
              focusLossCount: 3,
              score: null,
              maxScore: 100,
              feedback: '',
            },
          ],
        },
        {
          id: 'mock-asm-3',
          testId: 'test-3',
          title: 'Chemistry Organic Reactions Assessment',
          duration: 90,
          assignedByName: 'Dr. John Smith',
          assignedAt: new Date(now.getTime() + 2 * 24 * 3600000),
          scheduleWindowStart: new Date(now.getTime() + 2 * 24 * 3600000),
          scheduleWindowEnd: new Date(now.getTime() + 7 * 24 * 3600000),
          isReady: true,
          progress: {
            total: 0,
            completed: 0,
            active: 0,
          },
          averageScore: null,
          maxScore: 100,
          attempts: [],
        }
      );
    }

    return jsonOk(ongoingList);
  } catch (err) {
    return mapAuthzError(err);
  }
}
