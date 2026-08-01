import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { Prisma } from '../generated/prisma';
import { createNotification } from '../services/notification.service';

const EXAM_TYPES = ['quiz', 'class_test', 'unit_test', 'practice', 'mock', 'final'];

async function loadRequestingUser(req: AuthRequest) {
  const userId = req.user?.userId;
  return prisma.user.findUnique({ where: { id: userId } });
}

async function assertClassAccess(classId: string, user: { id: string; workspaceId: string | null; role: string }) {
  const classroom = await prisma.class.findUnique({ where: { id: classId } });
  if (!classroom || classroom.workspaceId !== user.workspaceId) return false;
  if (user.role.toLowerCase() === 'principal') return true;
  const assigned = await prisma.classTeacher.findFirst({ where: { classId, teacherId: user.id } });
  return !!assigned;
}

async function assertExamOwnership(examId: string, user: { id: string; workspaceId: string | null; role: string }) {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam || exam.workspaceId !== user.workspaceId) return { exam: null, error: { status: 404, message: 'Exam not found.' } };
  const hasAccess = await assertClassAccess(exam.classId, user);
  if (!hasAccess) return { exam: null, error: { status: 403, message: 'Not assigned to this class.' } };
  return { exam, error: null };
}

// -------------------------------------------------------------
// TEACHER: EXAM AUTHORING
// -------------------------------------------------------------

export const createExam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }

    const { title, description, classId, examType, subject, durationMinutes, passingPercentage, shuffleQuestions, shuffleOptions, questionIds } = req.body;
    if (!title || !classId || !durationMinutes) {
      res.status(400).json({ success: false, message: 'title, classId, and durationMinutes are required.' });
      return;
    }
    if (examType && !EXAM_TYPES.includes(examType)) {
      res.status(400).json({ success: false, message: `examType must be one of: ${EXAM_TYPES.join(', ')}` });
      return;
    }

    const hasAccess = await assertClassAccess(classId, user);
    if (!hasAccess) {
      res.status(403).json({ success: false, message: 'Not assigned to this class.' });
      return;
    }

    const questions: { questionId: string; marks?: number; negativeMarks?: number }[] = Array.isArray(questionIds) ? questionIds : [];
    if (questions.length > 0) {
      const validQuestions = await prisma.question.findMany({
        where: { id: { in: questions.map((q) => q.questionId) }, workspaceId: user.workspaceId },
        select: { id: true },
      });
      const validIds = new Set(validQuestions.map((q) => q.id));
      const invalid = questions.filter((q) => !validIds.has(q.questionId));
      if (invalid.length > 0) {
        res.status(400).json({ success: false, message: 'One or more questionIds are invalid or outside your workspace.' });
        return;
      }
    }

    const isPrincipalCreator = user.role.toLowerCase() === 'principal';

    const exam = await prisma.exam.create({
      data: {
        workspaceId: user.workspaceId,
        classId,
        createdByUserId: user.id,
        title,
        description: description || undefined,
        examType: examType || 'quiz',
        subject: subject || undefined,
        durationMinutes,
        passingPercentage: passingPercentage || undefined,
        shuffleQuestions: !!shuffleQuestions,
        shuffleOptions: !!shuffleOptions,
        reviewStatus: isPrincipalCreator ? 'approved' : 'pending',
        examQuestions: {
          create: questions.map((q, i) => ({
            questionId: q.questionId,
            order: i,
            marks: q.marks ?? 1,
            negativeMarks: q.negativeMarks ?? 0,
          })),
        },
      },
      include: { examQuestions: true },
    });

    res.status(201).json({ success: true, data: exam });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    let classIdFilter: { in: string[] } | undefined;
    if (!isPrincipal) {
      const links = await prisma.classTeacher.findMany({ where: { teacherId: user.id }, select: { classId: true } });
      classIdFilter = { in: links.map((l) => l.classId) };
    }

    const exams = await prisma.exam.findMany({
      where: { workspaceId: user.workspaceId, ...(classIdFilter ? { classId: classIdFilter } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        Class: { select: { id: true, name: true } },
        _count: { select: { examQuestions: true, attempts: true } },
      },
    });

    res.json({ success: true, data: exams });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExamDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }

    const { id } = req.params;
    const { exam, error } = await assertExamOwnership(id as string, user);
    if (error) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    const full = await prisma.exam.findUnique({
      where: { id: id as string },
      include: {
        Class: { select: { id: true, name: true } },
        examQuestions: { include: { Question: true }, orderBy: { order: 'asc' } },
      },
    });

    res.json({ success: true, data: full });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateExamStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }

    const { id } = req.params;
    const { status, scheduledStart, scheduledEnd } = req.body;
    if (!['draft', 'published', 'archived'].includes(status)) {
      res.status(400).json({ success: false, message: 'status must be draft, published, or archived.' });
      return;
    }

    const { exam: existingExam, error } = await assertExamOwnership(id as string, user);
    if (error) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';

    if (status === 'published') {
      const questionCount = await prisma.examQuestion.count({ where: { examId: id as string } });
      if (questionCount === 0) {
        res.status(400).json({ success: false, message: 'Cannot publish an exam with no questions.' });
        return;
      }
      if (!isPrincipal && existingExam!.reviewStatus !== 'approved') {
        res.status(400).json({
          success: false,
          code: 'AWAITING_APPROVAL',
          message: 'This exam is awaiting principal approval before it can be published.',
        });
        return;
      }
    }

    const updated = await prisma.exam.update({
      where: { id: id as string },
      data: {
        status,
        // Principal publishing implicitly approves the exam if it wasn't already.
        ...(status === 'published' && isPrincipal && existingExam!.reviewStatus !== 'approved'
          ? { reviewStatus: 'approved' }
          : {}),
        ...(scheduledStart !== undefined ? { scheduledStart: scheduledStart ? new Date(scheduledStart) : null } : {}),
        ...(scheduledEnd !== undefined ? { scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null } : {}),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewExam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }
    if (user.role.toLowerCase() !== 'principal') {
      res.status(403).json({ success: false, message: 'Only principals can review exams.' });
      return;
    }

    const { id } = req.params;
    const { action, reviewNote } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ success: false, message: "action must be 'approve' or 'reject'." });
      return;
    }

    const exam = await prisma.exam.findUnique({ where: { id: id as string } });
    if (!exam || exam.workspaceId !== user.workspaceId) {
      res.status(404).json({ success: false, message: 'Exam not found.' });
      return;
    }

    const updated = await prisma.exam.update({
      where: { id: id as string },
      data: { reviewStatus: action === 'approve' ? 'approved' : 'rejected', reviewNote: reviewNote || null },
    });

    await createNotification({
      userId: exam.createdByUserId,
      workspaceId: user.workspaceId,
      type: action === 'approve' ? 'exam_approved' : 'exam_rejected',
      title: action === 'approve' ? 'Exam approved' : 'Exam needs changes',
      message: action === 'approve'
        ? `Your exam "${exam.title}" was approved and can now be published.`
        : `Your exam "${exam.title}" was rejected.${reviewNote ? ` Note: ${reviewNote}` : ''}`,
      actionUrl: '/exams',
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInstitutionExamSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }
    if (user.role.toLowerCase() !== 'principal') {
      res.status(403).json({ success: false, message: 'Only principals can view institution-wide exam analytics.' });
      return;
    }

    const exams = await prisma.exam.findMany({
      where: { workspaceId: user.workspaceId },
      select: { id: true, status: true, reviewStatus: true, subject: true, classId: true, passingPercentage: true, Class: { select: { name: true } } },
    });

    const statusCounts: Record<string, number> = {};
    let pendingReviewCount = 0;
    for (const e of exams) {
      statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
      if (e.reviewStatus === 'pending') pendingReviewCount++;
    }

    const examIds = exams.map((e) => e.id);
    const examById = new Map(exams.map((e) => [e.id, e]));

    const attempts = await prisma.examAttempt.findMany({
      where: { examId: { in: examIds }, percentage: { not: null } },
      select: { examId: true, studentId: true, percentage: true, Student: { select: { name: true } } },
    });

    let totalPercentage = 0;
    let passCount = 0;
    const byClass = new Map<string, { name: string; total: number; count: number }>();
    const bySubject = new Map<string, { total: number; count: number }>();

    for (const a of attempts) {
      const exam = examById.get(a.examId);
      if (!exam || a.percentage === null) continue;
      totalPercentage += a.percentage;
      if (exam.passingPercentage != null && a.percentage >= exam.passingPercentage) passCount++;

      const classEntry = byClass.get(exam.classId) || { name: exam.Class?.name || 'Unknown', total: 0, count: 0 };
      classEntry.total += a.percentage;
      classEntry.count += 1;
      byClass.set(exam.classId, classEntry);

      const subjectKey = exam.subject || 'General';
      const subjectEntry = bySubject.get(subjectKey) || { total: 0, count: 0 };
      subjectEntry.total += a.percentage;
      subjectEntry.count += 1;
      bySubject.set(subjectKey, subjectEntry);
    }

    const classAverages = Array.from(byClass.entries()).map(([classId, v]) => ({
      classId,
      className: v.name,
      averagePercentage: Math.round((v.total / v.count) * 10) / 10,
      attempts: v.count,
    })).sort((a, b) => b.averagePercentage - a.averagePercentage);

    const subjectAverages = Array.from(bySubject.entries()).map(([subject, v]) => ({
      subject,
      averagePercentage: Math.round((v.total / v.count) * 10) / 10,
      attempts: v.count,
    })).sort((a, b) => b.averagePercentage - a.averagePercentage);

    const topPerformers = [...attempts]
      .filter((a) => a.percentage !== null)
      .sort((a, b) => (b.percentage as number) - (a.percentage as number))
      .slice(0, 10)
      .map((a) => ({ studentId: a.studentId, studentName: a.Student.name, percentage: a.percentage, examId: a.examId }));

    res.json({
      success: true,
      data: {
        totalExams: exams.length,
        statusCounts,
        pendingReviewCount,
        totalAttempts: attempts.length,
        averagePercentage: attempts.length > 0 ? Math.round((totalPercentage / attempts.length) * 10) / 10 : 0,
        passRate: attempts.length > 0 ? Math.round((passCount / attempts.length) * 1000) / 10 : 0,
        classAverages,
        subjectAverages,
        topPerformers,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteExam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }

    const { id } = req.params;
    const { error } = await assertExamOwnership(id as string, user);
    if (error) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    const attemptCount = await prisma.examAttempt.count({ where: { examId: id as string } });
    if (attemptCount > 0) {
      res.status(400).json({ success: false, message: 'Cannot delete an exam that already has student attempts. Archive it instead.' });
      return;
    }

    await prisma.exam.delete({ where: { id: id as string } });
    res.json({ success: true, message: 'Exam deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExamResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }

    const { id } = req.params;
    const { error } = await assertExamOwnership(id as string, user);
    if (error) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    const attempts = await prisma.examAttempt.findMany({
      where: { examId: id as string, status: { in: ['submitted', 'auto_submitted', 'evaluated'] } },
      include: { Student: { select: { id: true, name: true } } },
      orderBy: { percentage: 'desc' },
    });

    const scored = attempts.filter((a) => a.percentage !== null);
    const average = scored.length > 0 ? scored.reduce((s, a) => s + (a.percentage || 0), 0) / scored.length : null;
    const highest = scored.length > 0 ? Math.max(...scored.map((a) => a.percentage || 0)) : null;
    const lowest = scored.length > 0 ? Math.min(...scored.map((a) => a.percentage || 0)) : null;

    const leaderboard = attempts.map((a, i) => ({
      rank: i + 1,
      studentId: a.studentId,
      name: a.Student.name,
      score: a.score,
      totalMarks: a.totalMarks,
      percentage: a.percentage,
    }));

    res.json({ success: true, data: { average, highest, lowest, attemptCount: attempts.length, leaderboard } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------
// STUDENT: EXAM ATTEMPTS
// -------------------------------------------------------------

// Array.sort(() => Math.random() - 0.5) is a statistically biased shuffle (comparator-based
// sorts don't produce uniform permutations) — some orderings come up far more often than
// others. Fisher-Yates is the standard unbiased in-place shuffle.
function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function scoreAnswer(question: { type: string; correctAnswer: any }, selectedAnswer: any): boolean | null {
  if (question.type === 'mcq' || question.type === 'true_false' || question.type === 'numerical') {
    if (question.correctAnswer === undefined || question.correctAnswer === null) return null;
    return JSON.stringify(selectedAnswer) === JSON.stringify(question.correctAnswer);
  }
  // Free-text / coding / long-answer types require manual grading.
  return null;
}

export const listAvailableExams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }

    const classLinks = await prisma.classStudent.findMany({ where: { studentId: user.id }, select: { classId: true } });
    const classIds = classLinks.map((c) => c.classId);

    const exams = await prisma.exam.findMany({
      where: { workspaceId: user.workspaceId, classId: { in: classIds }, status: 'published' },
      include: {
        Class: { select: { id: true, name: true } },
        _count: { select: { examQuestions: true } },
        attempts: { where: { studentId: user.id }, select: { id: true, status: true, percentage: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: exams });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startAttempt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, message: 'Workspace mapping not found.' });
      return;
    }

    const { id } = req.params;
    const exam = await prisma.exam.findUnique({ where: { id: id as string }, include: { examQuestions: { include: { Question: true }, orderBy: { order: 'asc' } } } });
    if (!exam || exam.workspaceId !== user.workspaceId || exam.status !== 'published') {
      res.status(404).json({ success: false, message: 'Exam not found or not published.' });
      return;
    }

    const enrolled = await prisma.classStudent.findFirst({ where: { classId: exam.classId, studentId: user.id } });
    if (!enrolled) {
      res.status(403).json({ success: false, message: 'You are not enrolled in this class.' });
      return;
    }

    if (exam.scheduledStart && new Date() < exam.scheduledStart) {
      res.status(403).json({ success: false, message: 'This exam has not opened yet.' });
      return;
    }
    if (exam.scheduledEnd && new Date() > exam.scheduledEnd) {
      res.status(403).json({ success: false, message: 'This exam window has closed.' });
      return;
    }

    let attempt = await prisma.examAttempt.findUnique({ where: { examId_studentId: { examId: exam.id, studentId: user.id } } });
    if (attempt && attempt.status !== 'in_progress') {
      res.status(403).json({ success: false, message: 'You have already submitted this exam.' });
      return;
    }

    if (!attempt) {
      const totalMarks = exam.examQuestions.reduce((s, q) => s + q.marks, 0);
      attempt = await prisma.examAttempt.create({
        data: {
          examId: exam.id,
          studentId: user.id,
          totalMarks,
          timeRemainingSeconds: exam.durationMinutes * 60,
        },
      });
    }

    const questions = exam.shuffleQuestions ? shuffle(exam.examQuestions) : exam.examQuestions;

    const existingAnswers = await prisma.examAnswer.findMany({ where: { attemptId: attempt.id } });
    const answerMap = new Map(existingAnswers.map((a) => [a.questionId, a]));

    const elapsedSeconds = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
    const remaining = Math.max(0, exam.durationMinutes * 60 - elapsedSeconds);

    res.json({
      success: true,
      data: {
        attemptId: attempt.id,
        exam: { id: exam.id, title: exam.title, durationMinutes: exam.durationMinutes },
        timeRemainingSeconds: remaining,
        questions: questions.map((eq) => ({
          examQuestionId: eq.id,
          questionId: eq.questionId,
          marks: eq.marks,
          type: eq.Question.type,
          questionText: eq.Question.questionText,
          options: exam.shuffleOptions && Array.isArray(eq.Question.options)
            ? shuffle(eq.Question.options as any[])
            : eq.Question.options,
          selectedAnswer: answerMap.get(eq.questionId)?.selectedAnswer ?? null,
          markedForReview: answerMap.get(eq.questionId)?.markedForReview ?? false,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const autosaveAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user) {
      res.status(400).json({ success: false, message: 'User not found.' });
      return;
    }

    const { attemptId } = req.params;
    const { questionId, selectedAnswer, markedForReview, timeRemainingSeconds } = req.body;

    const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId as string } });
    if (!attempt || attempt.studentId !== user.id) {
      res.status(404).json({ success: false, message: 'Attempt not found.' });
      return;
    }
    if (attempt.status !== 'in_progress') {
      res.status(403).json({ success: false, message: 'This attempt has already been submitted.' });
      return;
    }

    // Re-verify tenant scoping on the parent exam rather than trusting studentId alone.
    const parentExam = await prisma.exam.findUnique({ where: { id: attempt.examId }, select: { workspaceId: true } });
    if (!parentExam || parentExam.workspaceId !== user.workspaceId) {
      res.status(404).json({ success: false, message: 'Attempt not found.' });
      return;
    }

    if (questionId) {
      await prisma.examAnswer.upsert({
        where: { attemptId_questionId: { attemptId: attemptId as string, questionId } },
        update: { selectedAnswer, markedForReview: !!markedForReview },
        create: { attemptId: attemptId as string, questionId, selectedAnswer, markedForReview: !!markedForReview },
      });
    }

    if (typeof timeRemainingSeconds === 'number') {
      await prisma.examAttempt.update({ where: { id: attemptId as string }, data: { timeRemainingSeconds } });
    }

    res.json({ success: true, message: 'Autosaved.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitAttempt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user) {
      res.status(400).json({ success: false, message: 'User not found.' });
      return;
    }

    const { attemptId } = req.params;
    const autoSubmitted = !!req.body?.autoSubmitted;

    const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId as string } });
    if (!attempt || attempt.studentId !== user.id) {
      res.status(404).json({ success: false, message: 'Attempt not found.' });
      return;
    }
    if (attempt.status !== 'in_progress') {
      res.json({ success: true, message: 'Already submitted.' });
      return;
    }

    // Re-verify tenant scoping on the parent exam — attempt.studentId alone doesn't
    // guarantee the exam still belongs to the student's workspace.
    const examInfo = await prisma.exam.findUnique({
      where: { id: attempt.examId },
      select: { title: true, workspaceId: true, classId: true, createdByUserId: true },
    });
    if (!examInfo || examInfo.workspaceId !== user.workspaceId) {
      res.status(404).json({ success: false, message: 'Attempt not found.' });
      return;
    }

    const [examQuestions, answers] = await Promise.all([
      prisma.examQuestion.findMany({ where: { examId: attempt.examId }, include: { Question: true } }),
      prisma.examAnswer.findMany({ where: { attemptId: attemptId as string } }),
    ]);
    const answerMap = new Map(answers.map((a) => [a.questionId, a]));

    let score = 0;
    let hasUngraded = false;
    const gradedAnswers: { id: string; isCorrect: boolean | null; marksAwarded: number | null }[] = [];
    for (const eq of examQuestions) {
      const answer = answerMap.get(eq.questionId);
      const isCorrect = answer ? scoreAnswer(eq.Question, answer.selectedAnswer) : null;
      let marksAwarded: number | null = null;
      if (isCorrect === true) marksAwarded = eq.marks;
      else if (isCorrect === false) marksAwarded = -eq.negativeMarks;
      else hasUngraded = true;

      if (answer) gradedAnswers.push({ id: answer.id, isCorrect, marksAwarded });
      score += marksAwarded ?? 0;
    }

    const totalMarks = examQuestions.reduce((s, q) => s + q.marks, 0);
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 1000) / 10 : 0;
    const finalStatus = hasUngraded ? (autoSubmitted ? 'auto_submitted' : 'submitted') : 'evaluated';

    // Grading + finalize run as one atomic unit: either every answer gets its marks and the
    // attempt gets finalized, or neither happens. The finalize step is a single guarded UPDATE
    // (status = 'in_progress' -> anything else) so a concurrent double-submit is resolved by the
    // database — the loser gets 0 rows back instead of re-running/overwriting the grade.
    const updated = await prisma.$transaction(async (tx) => {
      if (gradedAnswers.length > 0) {
        const valueRows = gradedAnswers.map(
          (a) => Prisma.sql`(${a.id}::text, ${a.isCorrect}::boolean, ${a.marksAwarded}::double precision)`
        );
        await tx.$executeRaw`
          UPDATE "ExamAnswer" AS ea
          SET "isCorrect" = v.is_correct, "marksAwarded" = v.marks_awarded
          FROM (VALUES ${Prisma.join(valueRows)}) AS v(id, is_correct, marks_awarded)
          WHERE ea.id = v.id
        `;
      }

      const finalized = await tx.$queryRaw<{ id: string }[]>`
        UPDATE "ExamAttempt"
        SET status = ${finalStatus}, "submittedAt" = NOW(), score = ${score}, "totalMarks" = ${totalMarks}, percentage = ${percentage}
        WHERE id = ${attemptId} AND status = 'in_progress'
        RETURNING id
      `;
      if (finalized.length === 0) return null;

      return tx.examAttempt.findUniqueOrThrow({ where: { id: attemptId as string } });
    });

    if (!updated) {
      res.json({ success: true, message: 'Already submitted.' });
      return;
    }

    if (examInfo) {
      const teacherLinks = await prisma.classTeacher.findMany({ where: { classId: examInfo.classId }, select: { teacherId: true } });
      const notifyIds = new Set([examInfo.createdByUserId, ...teacherLinks.map((t) => t.teacherId)]);
      for (const teacherId of notifyIds) {
        await createNotification({
          userId: teacherId,
          workspaceId: examInfo.workspaceId,
          type: 'exam_completed',
          title: 'Exam completed',
          message: `${user.name} completed "${examInfo.title}"`,
          actionUrl: '/exams',
        });
      }
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordViolation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user) {
      res.status(400).json({ success: false, message: 'User not found.' });
      return;
    }

    const { attemptId } = req.params;
    const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId as string } });
    if (!attempt || attempt.studentId !== user.id) {
      res.status(404).json({ success: false, message: 'Attempt not found.' });
      return;
    }

    const updated = await prisma.examAttempt.update({
      where: { id: attemptId as string },
      data: { violationCount: { increment: 1 } },
    });

    res.json({ success: true, data: { violationCount: updated.violationCount } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
