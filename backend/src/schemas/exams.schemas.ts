import { z } from 'zod';

// selectedAnswer shape varies by question type (string, string[], number, boolean, match/order
// arrays, ...) so it stays typed as `unknown` — but it's still capped in size. Without a cap,
// an autosave loop firing per keystroke on a manipulated/oversized payload is a write-
// amplification and storage risk with no legitimate answer ever needing this much space.
const MAX_ANSWER_BYTES = 20_000;
const boundedAnswer = z.unknown().refine(
  (value) => value === undefined || value === null || JSON.stringify(value).length <= MAX_ANSWER_BYTES,
  { message: `selectedAnswer must serialize to at most ${MAX_ANSWER_BYTES} bytes` }
);

export const autosaveAnswerSchema = z.object({
  questionId: z.string().min(1).max(100).optional(),
  selectedAnswer: boundedAnswer.optional(),
  markedForReview: z.boolean().optional(),
  // A generous upper bound (48h) — anything beyond that is a malformed/malicious client value,
  // not a legitimate remaining-time figure.
  timeRemainingSeconds: z.number().int().min(0).max(48 * 60 * 60).optional(),
});

export const submitAttemptSchema = z.object({
  autoSubmitted: z.boolean().optional(),
});

const EXAM_TYPES = ['quiz', 'class_test', 'unit_test', 'practice', 'mock', 'final'] as const;

export const createExamSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional().nullable(),
  classId: z.string().min(1),
  examType: z.enum(EXAM_TYPES).optional(),
  subject: z.string().max(200).optional().nullable(),
  durationMinutes: z.number().int().positive().max(24 * 60),
  passingPercentage: z.number().min(0).max(100).optional().nullable(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  questionIds: z
    .array(
      z.object({
        questionId: z.string().min(1),
        marks: z.number().min(0).max(1000).optional(),
        negativeMarks: z.number().min(0).max(1000).optional(),
      })
    )
    .max(500)
    .optional(),
});

// Matches the permissiveness of the original `new Date(x)` call this replaces — any
// string JS can parse into a valid date, not strictly full ISO-8601-with-timezone.
const parsableDateString = z.string().refine((v) => !Number.isNaN(Date.parse(v)), { message: 'must be a valid date string' });

export const updateExamStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']),
  scheduledStart: parsableDateString.nullable().optional(),
  scheduledEnd: parsableDateString.nullable().optional(),
});

export const reviewExamSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reviewNote: z.string().max(2000).optional().nullable(),
});
