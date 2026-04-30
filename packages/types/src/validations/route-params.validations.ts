import z from 'zod';

export const generalRouteParamSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(40),
  sortBy: z.enum(['asc', 'desc']).default('desc'),
});

export const getRouteParamSchema = generalRouteParamSchema.extend({
  sortField: z.enum(['createdAt', 'name', 'email']).default('createdAt'),
});

export const getHistoryQuerySchema = generalRouteParamSchema.extend({
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

export type IRouteParams = z.infer<typeof generalRouteParamSchema>;

const routeParamsValidations = {
  getRouteParamSchema,
  getHistoryQuerySchema,
} as const;

export { routeParamsValidations };
