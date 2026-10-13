import { z } from 'zod';

export const updateViewsSchema = z.object({
  views: z.number().int('Views must be an integer').min(0, 'Views cannot be negative'),
});

export type UpdateViewsInput = z.infer<typeof updateViewsSchema>;
