import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().positive(),
  durationMonths: z.number().int().positive(),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().optional(),
});

export const updatePlanSchema = z
  .object({
    name: z.string().min(1).optional(),
    price: z.number().int().positive().optional(),
    durationMonths: z.number().int().positive().optional(),
    features: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'No fields to update',
  });
