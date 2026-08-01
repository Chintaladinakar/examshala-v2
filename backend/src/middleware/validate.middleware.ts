import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

/**
 * Validates `req.body` against `schema` before the controller runs, rejecting malformed or
 * oversized payloads at the boundary instead of letting them reach Prisma's Json? columns
 * unchecked. On success, `req.body` is replaced with the parsed (and thus type-narrowed,
 * default-filled) value.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Treat a missing body the same as an empty object — routes that only take optional
    // fields (e.g. `POST .../submit` with no payload) shouldn't fail validation just because
    // no Content-Type: application/json body was sent at all.
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Request body failed validation.',
        errors: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
