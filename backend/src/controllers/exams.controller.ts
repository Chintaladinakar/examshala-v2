import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
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

    const { error } = await assertExamOwnership(id as string, user);
    if (error) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }

    if (status === 'published') {
      const questionCount = await prisma.examQuestion.count({ where: { examId: id as string } });
      if (questionCount === 0) {
        res.status(400).json({ success: false, message: 'Cannot publish an exam with no questions.' });
        return;
      }
    }

    const updated = await prisma.exam.update({
      where: { id: id as string },
      data: {
        status,
        ...(scheduledStart !== undefined ? { scheduledStart: scheduledStart ? new Date(scheduledStart) : null } : {}),
        ...(scheduledEnd !== undefined ? { scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null } : {}),
      },
    });

    res.json({ success: true, data: updated });
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

    const questions = exam.shuffleQuestions ? [...exam.examQuestions].sort(() => Math.random() - 0.5) : exam.examQuestions;

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
            ? [...(eq.Question.options as any[])].sort(() => Math.random() - 0.5)
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

    const [examQuestions, answers] = await Promise.all([
      prisma.examQuestion.findMany({ where: { examId: attempt.examId }, include: { Question: true } }),
      prisma.examAnswer.findMany({ where: { attemptId: attemptId as string } }),
    ]);
    const answerMap = new Map(answers.map((a) => [a.questionId, a]));

    let score = 0;
    let hasUngraded = false;
    for (const eq of examQuestions) {
      const answer = answerMap.get(eq.questionId);
      const isCorrect = answer ? scoreAnswer(eq.Question, answer.selectedAnswer) : null;
      let marksAwarded: number | null = null;
      if (isCorrect === true) marksAwarded = eq.marks;
      else if (isCorrect === false) marksAwarded = -eq.negativeMarks;
      else hasUngraded = true;

      if (answer) {
        await prisma.examAnswer.update({
          where: { id: answer.id },
          data: { isCorrect: isCorrect ?? undefined, marksAwarded: marksAwarded ?? undefined },
        });
      }
      score += marksAwarded ?? 0;
    }

    const totalMarks = examQuestions.reduce((s, q) => s + q.marks, 0);
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 1000) / 10 : 0;

    const updated = await prisma.examAttempt.update({
      where: { id: attemptId as string },
      data: {
        status: hasUngraded ? (autoSubmitted ? 'auto_submitted' : 'submitted') : 'evaluated',
        submittedAt: new Date(),
        score,
        totalMarks,
        percentage,
      },
    });

    const examInfo = await prisma.exam.findUnique({ where: { id: attempt.examId }, select: { title: true, workspaceId: true, classId: true, createdByUserId: true } });
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
