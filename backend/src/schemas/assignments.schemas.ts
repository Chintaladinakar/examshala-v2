import { z } from 'zod';

// uploadedFiles are URLs today (see assignments.controller.ts) — capped in count and per-item
// length so a malformed/abusive payload can't balloon the AssignmentSubmission row.
const uploadedFiles = z.array(z.string().max(2000)).max(20).optional();

export const submitAssignmentSchema = z.object({
  assignmentId: z.string().min(1),
  textSubmission: z.string().max(20_000).optional().nullable(),
  uploadedFiles,
});

export const editSubmissionSchema = z.object({
  textSubmission: z.string().max(20_000).optional().nullable(),
  uploadedFiles,
});
