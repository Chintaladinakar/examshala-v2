import { z } from 'zod';

// Type/visibility membership and the LINK-vs-fileId conditional requirement are still enforced
// in the controller (they depend on business logic — e.g. cross-checking fileId ownership —
// that doesn't belong in a shape-validation layer); this schema guards the boundary: reject
// wrong types and oversized strings before any of that runs.
export const createMaterialSchema = z.object({
  title: z.string().min(1).max(300),
  type: z.string().min(1).max(20),
  fileUrl: z.string().max(2000).optional(),
  fileId: z.string().max(100).optional(),
  subject: z.string().min(1).max(200),
  chapter: z.string().max(200).optional().nullable(),
  topic: z.string().max(200).optional().nullable(),
  classId: z.string().max(100).optional().nullable(),
  visibility: z.string().max(20).optional(),
  scheduledAt: z.string().optional().nullable(),
});

export const updateMaterialSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  subject: z.string().min(1).max(200).optional(),
  chapter: z.string().max(200).optional().nullable(),
  topic: z.string().max(200).optional().nullable(),
  visibility: z.string().max(20).optional(),
  scheduledAt: z.string().optional().nullable(),
});
