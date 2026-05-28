import { z } from 'zod';

export const ResultsQuerySchema = z.object({
  status: z.string().optional().default('COMPLETED'),
});

export type ResultsQuery = z.infer<typeof ResultsQuerySchema>;
