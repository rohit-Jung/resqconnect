import z from 'zod';

export const getRouteParamSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(40),
  sortBy: z.enum(['asc', 'desc']).default('desc'),
  sortField: z.enum(['createdAt', 'name', 'email']).default('createdAt'),
});
