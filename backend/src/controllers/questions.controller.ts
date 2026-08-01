import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { createNotification } from '../services/notification.service';

const QUESTION_TYPES = ['mcq', 'true_false', 'short_answer', 'long_answer', 'coding', 'case_study', 'numerical', 'match', 'ordering'];
const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];

async function loadRequestingUser(req: AuthRequest) {
  const userId = req.user?.userId;
  return prisma.user.findUnique({ where: { id: userId } });
}

function assertRole(role: string) {
  const r = role.toLowerCase();
  return r === 'teacher' || r === 'principal';
}

export const getQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }
    if (!assertRole(user.role)) {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only teachers and principals can view the question bank.' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    const { subject, type, difficulty, search, tag, reviewStatus } = req.query;

    const where: any = { workspaceId: user.workspaceId, isArchived: false };
    if (subject) where.subject = { equals: subject as string, mode: 'insensitive' };
    if (type) where.type = type as string;
    if (difficulty) where.difficulty = difficulty as string;
    if (tag) where.tags = { has: tag as string };
    if (search) where.questionText = { contains: search as string, mode: 'insensitive' };
    if (reviewStatus) where.reviewStatus = reviewStatus as string;

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { CreatedBy: { select: { id: true, name: true } } },
      }),
      prisma.question.count({ where }),
    ]);

    res.json({ success: true, data: questions, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }
    if (!assertRole(user.role)) {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only teachers and principals can author questions.' });
      return;
    }

    const {
      type, difficulty, subject, chapter, topic, learningOutcome, bloomLevel, tags,
      questionText, options, correctAnswer, explanation,
    } = req.body;

    if (!type || !subject || !questionText) {
      res.status(400).json({ success: false, message: 'type, subject, and questionText are required.' });
      return;
    }
    if (!QUESTION_TYPES.includes(type)) {
      res.status(400).json({ success: false, message: `type must be one of: ${QUESTION_TYPES.join(', ')}` });
      return;
    }
    const normalizedDifficulty = difficulty && DIFFICULTIES.includes(difficulty) ? difficulty : 'medium';

    // Lightweight duplicate detection: flag (not block) near-identical question text in the same subject.
    const possibleDuplicate = await prisma.question.findFirst({
      where: { workspaceId: user.workspaceId, subject, questionText: { equals: questionText, mode: 'insensitive' } },
      select: { id: true },
    });

    const isPrincipalCreator = user.role.toLowerCase() === 'principal';

    const question = await prisma.question.create({
      data: {
        workspaceId: user.workspaceId,
        createdByUserId: user.id,
        type,
        difficulty: normalizedDifficulty,
        subject,
        chapter: chapter || undefined,
        topic: topic || undefined,
        learningOutcome: learningOutcome || undefined,
        bloomLevel: bloomLevel || undefined,
        tags: Array.isArray(tags) ? tags : [],
        questionText,
        options: options ?? undefined,
        correctAnswer: correctAnswer ?? undefined,
        explanation: explanation || undefined,
        reviewStatus: isPrincipalCreator ? 'approved' : 'pending',
      },
    });

    res.status(201).json({ success: true, data: question, duplicateOf: possibleDuplicate?.id || null });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const { id } = req.params;
    const existing = await prisma.question.findUnique({ where: { id: id as string } });
    if (!existing || existing.workspaceId !== user.workspaceId) {
      res.status(404).json({ success: false, message: 'Question not found.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    if (!isPrincipal && existing.createdByUserId !== user.id) {
      res.status(403).json({ success: false, message: 'You can only edit questions you authored.' });
      return;
    }

    const {
      type, difficulty, subject, chapter, topic, learningOutcome, bloomLevel, tags,
      questionText, options, correctAnswer, explanation,
    } = req.body;

    if (type && !QUESTION_TYPES.includes(type)) {
      res.status(400).json({ success: false, message: `type must be one of: ${QUESTION_TYPES.join(', ')}` });
      return;
    }
    if (difficulty && !DIFFICULTIES.includes(difficulty)) {
      res.status(400).json({ success: false, message: `difficulty must be one of: ${DIFFICULTIES.join(', ')}` });
      return;
    }

    const updated = await prisma.question.update({
      where: { id: id as string },
      data: {
        ...(type !== undefined ? { type } : {}),
        ...(difficulty !== undefined ? { difficulty } : {}),
        ...(subject !== undefined ? { subject } : {}),
        ...(chapter !== undefined ? { chapter } : {}),
        ...(topic !== undefined ? { topic } : {}),
        ...(learningOutcome !== undefined ? { learningOutcome } : {}),
        ...(bloomLevel !== undefined ? { bloomLevel } : {}),
        ...(tags !== undefined ? { tags } : {}),
        ...(questionText !== undefined ? { questionText } : {}),
        ...(options !== undefined ? { options } : {}),
        ...(correctAnswer !== undefined ? { correctAnswer } : {}),
        ...(explanation !== undefined ? { explanation } : {}),
        version: { increment: 1 },
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }

    const { id } = req.params;
    const existing = await prisma.question.findUnique({ where: { id: id as string } });
    if (!existing || existing.workspaceId !== user.workspaceId) {
      res.status(404).json({ success: false, message: 'Question not found.' });
      return;
    }

    const isPrincipal = user.role.toLowerCase() === 'principal';
    if (!isPrincipal && existing.createdByUserId !== user.id) {
      res.status(403).json({ success: false, message: 'You can only archive questions you authored.' });
      return;
    }

    // Soft delete: questions may already be referenced by exams, so we archive rather than hard-delete.
    await prisma.question.update({ where: { id: id as string }, data: { isArchived: true } });

    res.json({ success: true, message: 'Question archived successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkImportQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }
    if (!assertRole(user.role)) {
      res.status(403).json({ success: false, code: 'ACCESS_DENIED', message: 'Only teachers and principals can import questions.' });
      return;
    }

    const items = req.body?.questions;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'questions must be a non-empty array.' });
      return;
    }
    if (items.length > 500) {
      res.status(400).json({ success: false, message: 'A maximum of 500 questions can be imported at once.' });
      return;
    }

    const valid: any[] = [];
    const rejected: { index: number; reason: string }[] = [];
    items.forEach((item: any, index: number) => {
      if (!item.type || !QUESTION_TYPES.includes(item.type)) {
        rejected.push({ index, reason: 'invalid or missing type' });
        return;
      }
      if (!item.subject || !item.questionText) {
        rejected.push({ index, reason: 'missing subject or questionText' });
        return;
      }
      valid.push({
        workspaceId: user.workspaceId,
        createdByUserId: user.id,
        type: item.type,
        difficulty: DIFFICULTIES.includes(item.difficulty) ? item.difficulty : 'medium',
        subject: item.subject,
        chapter: item.chapter || undefined,
        topic: item.topic || undefined,
        tags: Array.isArray(item.tags) ? item.tags : [],
        questionText: item.questionText,
        options: item.options ?? undefined,
        correctAnswer: item.correctAnswer ?? undefined,
        explanation: item.explanation || undefined,
      });
    });

    if (valid.length > 0) {
      await prisma.question.createMany({ data: valid });
    }

    res.status(201).json({ success: true, data: { importedCount: valid.length, rejected } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await loadRequestingUser(req);
    if (!user || !user.workspaceId) {
      res.status(400).json({ success: false, code: 'MISSING_WORKSPACE', message: 'Workspace mapping not found.' });
      return;
    }
    if (user.role.toLowerCase() !== 'principal') {
      res.status(403).json({ success: false, message: 'Only principals can review questions.' });
      return;
    }

    const { id } = req.params;
    const { action, reviewNote } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ success: false, message: "action must be 'approve' or 'reject'." });
      return;
    }

    const question = await prisma.question.findUnique({ where: { id: id as string } });
    if (!question || question.workspaceId !== user.workspaceId) {
      res.status(404).json({ success: false, message: 'Question not found.' });
      return;
    }

    const updated = await prisma.question.update({
      where: { id: id as string },
      data: { reviewStatus: action === 'approve' ? 'approved' : 'rejected', reviewNote: reviewNote || null },
    });

    await createNotification({
      userId: question.createdByUserId,
      workspaceId: user.workspaceId,
      type: action === 'approve' ? 'question_approved' : 'question_rejected',
      title: action === 'approve' ? 'Question approved' : 'Question needs changes',
      message: action === 'approve'
        ? 'Your question bank submission was approved.'
        : `Your question bank submission was rejected.${reviewNote ? ` Note: ${reviewNote}` : ''}`,
      actionUrl: '/question-bank',
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
