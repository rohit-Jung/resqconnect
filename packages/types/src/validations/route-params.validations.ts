import z from 'zod';

export const getRouteParamSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(40),
  sortBy: z.enum(['asc', 'desc']).default('desc'),
  sortField: z.enum(['createdAt', 'name', 'email']).default('createdAt'),
});

export const getHistoryQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  sortBy: z.enum(['asc', 'desc']).default('desc'),
  status: z
    .enum([
      'completed',
      'cancelled',
      'pending',
      'accepted',
      'in_progress',
      'no_providers',
    ])
    .optional(),
});

const routeParamsValidations = {
  getRouteParamSchema,
  getHistoryQuerySchema,
} as const;

export { routeParamsValidations };
