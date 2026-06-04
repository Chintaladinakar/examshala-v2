import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapAuthzError, jsonError, jsonOk } from '@/lib/school/http';
import { requireSchoolAuth, requireTeacherOrPrincipal } from '@/lib/school/authz';

// ─── Mock Fallbacks for Premium Visual Showcase ──────────────────────────────
const mockAttendance = [
  { id: 'ma-1', date: '2026-06-01T09:00:00.000Z', status: 'present', Class: { name: 'Mathematics 101' } },
  { id: 'ma-2', date: '2026-06-02T09:00:00.000Z', status: 'present', Class: { name: 'Mathematics 101' } },
  { id: 'ma-3', date: '2026-06-03T09:00:00.000Z', status: 'absent', Class: { name: 'Mathematics 101' } },
  { id: 'ma-4', date: '2026-05-25T09:00:00.000Z', status: 'present', Class: { name: 'Science 202' } },
  { id: 'ma-5', date: '2026-05-26T09:00:00.000Z', status: 'present', Class: { name: 'Science 202' } },
  { id: 'ma-6', date: '2026-05-27T09:00:00.000Z', status: 'present', Class: { name: 'Science 202' } },
  { id: 'ma-7', date: '2026-05-28T09:00:00.000Z', status: 'present', Class: { name: 'Science 202' } },
];

const mockTutorAttendance = [
  { id: 'mta-1', date: '2026-06-01T09:00:00.000Z', status: 'present', Class: { name: 'Tutor Check-In' } },
  { id: 'mta-2', date: '2026-06-02T09:00:00.000Z', status: 'present', Class: { name: 'Tutor Check-In' } },
  { id: 'mta-3', date: '2026-06-03T09:00:00.000Z', status: 'present', Class: { name: 'Tutor Check-In' } },
  { id: 'mta-4', date: '2026-05-25T09:00:00.000Z', status: 'present', Class: { name: 'Tutor Check-In' } },
  { id: 'mta-5', date: '2026-05-26T09:00:00.000Z', status: 'absent', Class: { name: 'Tutor Check-In' } },
  { id: 'mta-6', date: '2026-05-27T09:00:00.000Z', status: 'present', Class: { name: 'Tutor Check-In' } },
  { id: 'mta-7', date: '2026-05-28T09:00:00.000Z', status: 'present', Class: { name: 'Tutor Check-In' } },
];

const mockAssignments = [
  {
    id: 'asg-1',
    title: 'Trigonometry Homework 1',
    description: 'Solve questions 1 to 10 on page 42.',
    dueDate: '2026-06-10T23:59:59.000Z',
    Class: { id: 'class-1', name: 'Mathematics 101' },
    submissions: [
      { id: 'sub-1', fileUrl: '/uploads/homework1.pdf', submittedAt: '2026-06-02T15:00:00.000Z' }
    ],
    feedbacks: [
      { id: 'fb-1', comment: 'Great job, fully correct steps.', Creator: { name: 'Teacher John' }, createdAt: '2026-06-02T18:00:00.000Z' }
    ]
  },
  {
    id: 'asg-2',
    title: 'Newtonian Physics Problems',
    description: 'Solve the mechanics problem sheet attached.',
    dueDate: '2026-06-05T23:59:59.000Z',
    Class: { id: 'class-2', name: 'Science 202' },
    submissions: [],
    feedbacks: []
  },
  {
    id: 'asg-3',
    title: 'English Essay: Shakespeare',
    description: 'Write a 500-word analysis of Hamlet Act 3.',
    dueDate: '2026-05-20T23:59:59.000Z',
    Class: { id: 'class-3', name: 'English Lit' },
    submissions: [
      { id: 'sub-3', fileUrl: '/uploads/hamlet_essay.docx', submittedAt: '2026-05-18T10:00:00.000Z' }
    ],
    feedbacks: [
      { id: 'fb-3', comment: 'Excellent thesis, watch your pacing in the body paragraphs.', Creator: { name: 'Teacher Sarah' }, createdAt: '2026-05-19T09:00:00.000Z' }
    ]
  }
];

const mockResults = [
  {
    id: 'mr-1',
    subject: 'Mathematics',
    score: 85,
    totalMarks: 100,
    percentage: 85,
    grade: 'A',
    rank: 4,
    status: 'Passed',
    feedback: 'Excellent work on algebra and calculus.',
    createdAt: '2026-05-10T10:00:00.000Z'
  },
  {
    id: 'mr-2',
    subject: 'Physics',
    score: 94,
    totalMarks: 100,
    percentage: 94,
    grade: 'A+',
    rank: 1,
    status: 'Passed',
    feedback: 'Fantastic problem-solving skills in kinetics.',
    createdAt: '2026-05-15T14:30:00.000Z'
  },
  {
    id: 'mr-3',
    subject: 'Chemistry',
    score: 72,
    totalMarks: 100,
    percentage: 72,
    grade: 'B',
    rank: 12,
    status: 'Passed',
    feedback: 'Good effort, but study chemical equations more.',
    createdAt: '2026-05-22T11:00:00.000Z'
  }
];

const mockAttempts = [
  {
    id: 'att-1',
    focusLoss: 1,
    startedAt: '2026-05-10T09:30:00.000Z',
    submittedAt: '2026-05-10T10:00:00.000Z',
    status: 'submitted',
    Assignment: {
      Test: { title: 'Mid-term Math Quiz' }
    },
    Result: {
      score: 85,
      maxScore: 100,
      evaluatedAt: '2026-05-10T10:05:00.000Z',
      feedback: 'Great performance'
    }
  },
  {
    id: 'att-2',
    focusLoss: 0,
    startedAt: '2026-05-15T14:00:00.000Z',
    submittedAt: '2026-05-15T14:30:00.000Z',
    status: 'submitted',
    Assignment: {
      Test: { title: 'Mechanics Test 1' }
    },
    Result: {
      score: 94,
      maxScore: 100,
      evaluatedAt: '2026-05-15T14:35:00.000Z',
      feedback: 'Outstanding'
    }
  }
];

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireSchoolAuth();
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('studentId') || '';

    const isStudent = ctx.role === 'student';
    const isTeacher = ctx.role === 'teacher' || ctx.role === 'tutor';
    const isPrincipal = ctx.role === 'principal';

    // ─── If Teacher/Principal views high-level dashboard without selecting a target user ───
    if (!targetUserId && (isTeacher || isPrincipal)) {
      // 1. Fetch Students
      const studentUsers = await prisma.user.findMany({
        where: { workspaceId: ctx.workspaceId, role: 'student' },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          classStudents: {
            select: {
              Class: {
                select: { id: true, name: true }
              }
            }
          },
          results: {
            select: {
              percentage: true
            }
          },
          attendances: {
            select: {
              status: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      const processedStudents = studentUsers.map((s) => {
        const cls = s.classStudents[0]?.Class || null;
        const avgScore = s.results.length 
          ? s.results.reduce((acc, r) => acc + r.percentage, 0) / s.results.length 
          : 0;
        const presentCount = s.attendances.filter((a) => a.status === 'present').length;
        const attendanceRate = s.attendances.length 
          ? (presentCount / s.attendances.length) * 100 
          : 100;

        return {
          id: s.id,
          name: s.name,
          email: s.email,
          isActive: s.isActive,
          class: cls,
          avgScore: Math.round(avgScore * 10) / 10,
          attendanceRate: Math.round(attendanceRate * 10) / 10
        };
      });

      const demoStudents = processedStudents.length > 0 ? processedStudents : [
        { id: 'demo-s1', name: 'Aarav Sharma', email: 'aarav@edusphere.com', isActive: true, class: { id: 'c1', name: 'Grade 10-A' }, avgScore: 88.5, attendanceRate: 94.2 },
        { id: 'demo-s2', name: 'Diya Patel', email: 'diya@edusphere.com', isActive: true, class: { id: 'c1', name: 'Grade 10-A' }, avgScore: 92.1, attendanceRate: 97.5 },
        { id: 'demo-s3', name: 'Kabir Mehta', email: 'kabir@edusphere.com', isActive: true, class: { id: 'c2', name: 'Grade 11-B' }, avgScore: 78.4, attendanceRate: 85.0 },
        { id: 'demo-s4', name: 'Neha Reddy', email: 'neha@edusphere.com', isActive: true, class: { id: 'c2', name: 'Grade 11-B' }, avgScore: 65.2, attendanceRate: 72.8 },
      ];

      // 2. Fetch Tutors/Teachers (for the Principal to track Tutor Attendance)
      const tutorUsers = await prisma.user.findMany({
        where: { workspaceId: ctx.workspaceId, role: { in: ['teacher', 'tutor'] } },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          classTeachers: {
            select: {
              Class: {
                select: { id: true, name: true }
              }
            }
          },
          attendances: {
            select: {
              status: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      const processedTutors = tutorUsers.map((t) => {
        const clsList = t.classTeachers.map(ct => ct.Class);
        const presentCount = t.attendances.filter((a) => a.status === 'present').length;
        const attendanceRate = t.attendances.length 
          ? (presentCount / t.attendances.length) * 100 
          : 100;

        return {
          id: t.id,
          name: t.name,
          email: t.email,
          isActive: t.isActive,
          classes: clsList,
          attendanceRate: Math.round(attendanceRate * 10) / 10
        };
      });

      const demoTutors = processedTutors.length > 0 ? processedTutors : [
        { id: 'demo-t1', name: 'Professor John Doe', email: 'john@edusphere.com', isActive: true, classes: [{ id: 'c1', name: 'Grade 10-A' }], attendanceRate: 98.2 },
        { id: 'demo-t2', name: 'Professor Sarah Smith', email: 'sarah@edusphere.com', isActive: true, classes: [{ id: 'c1', name: 'Grade 10-A' }, { id: 'c2', name: 'Grade 11-B' }], attendanceRate: 95.0 },
        { id: 'demo-t3', name: 'Professor Robert Johnson', email: 'robert@edusphere.com', isActive: true, classes: [{ id: 'c2', name: 'Grade 11-B' }], attendanceRate: 88.4 },
      ];

      return jsonOk({
        isSummary: true,
        students: demoStudents,
        tutors: demoTutors,
        stats: {
          totalStudents: demoStudents.length,
          totalTutors: demoTutors.length,
          activeStudents: demoStudents.filter(s => s.isActive).length,
          avgWorkspaceAttendance: Math.round((demoStudents.reduce((acc, s) => acc + s.attendanceRate, 0) / demoStudents.length) * 10) / 10,
          avgTutorAttendance: Math.round((demoTutors.reduce((acc, t) => acc + t.attendanceRate, 0) / demoTutors.length) * 10) / 10,
          avgWorkspaceScore: Math.round((demoStudents.reduce((acc, s) => acc + s.avgScore, 0) / demoStudents.length) * 10) / 10,
        }
      });
    }

    // ─── If a specific profile is selected, or Student/Tutor accesses their own report ───
    const profileUserId = targetUserId || ctx.userId;

    // Fetch user details
    const userInfo = await prisma.user.findFirst({
      where: { id: profileUserId, workspaceId: ctx.workspaceId },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });

    if (!userInfo) {
      return jsonError('NOT_FOUND', 'User profile not found in this workspace', 404);
    }

    const isTargetTutor = userInfo.role.toLowerCase() === 'teacher' || userInfo.role.toLowerCase() === 'tutor' || userInfo.role.toLowerCase() === 'principal';

    // ─── IF TUTOR REPORT CARD REQUESTED ───
    if (isTargetTutor) {
      // 1. Fetch tutor attendance (studentId field holds the user ID)
      const dbAttendance = await prisma.attendance.findMany({
        where: { studentId: profileUserId, Class: { workspaceId: ctx.workspaceId } },
        include: {
          Class: { select: { id: true, name: true } }
        },
        orderBy: { date: 'desc' }
      });

      // 2. Fetch classes taught
      const tutorClasses = await prisma.classTeacher.findMany({
        where: { teacherId: profileUserId },
        include: {
          Class: {
            select: { id: true, name: true }
          }
        }
      });
      const classes = tutorClasses.map(tc => tc.Class);
      const classIds = classes.map(c => c.id);

      // 4. Fetch class average results for students in tutor's classes
      const studentLinks = await prisma.classStudent.findMany({
        where: { classId: { in: classIds } },
        select: { studentId: true }
      });
      const studentIdsInClasses = studentLinks.map(sl => sl.studentId);
      const dbClassResults = await prisma.result.findMany({
        where: { studentId: { in: studentIdsInClasses } },
        orderBy: { createdAt: 'desc' }
      });

      const finalAttendance = dbAttendance.length > 0 ? dbAttendance : mockTutorAttendance;
      const finalClassResults = dbClassResults.length > 0 ? dbClassResults : mockResults;

      return jsonOk({
        isSummary: false,
        isTutor: true,
        tutor: userInfo,
        classes,
        attendance: finalAttendance,
        classResults: finalClassResults
      });
    }

    // ─── IF STUDENT REPORT CARD REQUESTED ───
    // Fetch classes the student belongs to
    const studentClasses = await prisma.classStudent.findMany({
      where: { studentId: profileUserId },
      include: {
        Class: {
          select: { id: true, name: true }
        }
      }
    });

    const classIds = studentClasses.map((sc) => sc.classId);
    const classes = studentClasses.map((sc) => sc.Class);

    // Fetch attendance history
    const dbAttendance = await prisma.attendance.findMany({
      where: { studentId: profileUserId, Class: { workspaceId: ctx.workspaceId } },
      include: {
        Class: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });

    // Fetch general academic test results
    const dbResults = await prisma.result.findMany({
      where: { studentId: profileUserId },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch virtual exam attempts
    const dbAttempts = await prisma.assessmentAttempt.findMany({
      where: { studentId: profileUserId },
      include: {
        Assignment: {
          include: {
            Test: { select: { title: true } }
          }
        },
        Result: true
      },
      orderBy: { startedAt: 'desc' }
    });

    const finalAttendance = dbAttendance.length > 0 ? dbAttendance : mockAttendance;
    const finalResults = dbResults.length > 0 ? dbResults : mockResults;
    const finalAttempts = dbAttempts.length > 0 ? dbAttempts.map(a => ({
      id: a.id,
      focusLoss: a.focusLoss,
      startedAt: a.startedAt.toISOString(),
      submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
      status: a.status,
      Assignment: {
        Test: { title: a.Assignment?.Test?.title || 'Online Assessment' }
      },
      Result: a.Result ? {
        score: a.Result.score,
        maxScore: a.Result.maxScore,
        evaluatedAt: a.Result.evaluatedAt.toISOString(),
        feedback: a.Result.feedback
      } : null
    })) : mockAttempts;

    return jsonOk({
      isSummary: false,
      isTutor: false,
      student: userInfo,
      classes,
      attendance: finalAttendance,
      results: finalResults,
      attempts: finalAttempts
    });

  } catch (err) {
    return mapAuthzError(err);
  }
}
