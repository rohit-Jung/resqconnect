import { z } from 'zod';

export const initiateSubscriptionSchema = z.object({
  planId: z.string().uuid('Invalid plan ID format'),
  returnUrl: z.string().url('Invalid return URL').optional(),
});

export const khaltiCallbackSchema = z.object({
  pidx: z.string().min(1, 'pidx is required'),
  transaction_id: z.string().optional(),
  tidx: z.string().optional(),
  amount: z.string().optional(),
  total_amount: z.string().optional(),
  mobile: z.string().optional(),
  status: z.string().min(1, 'status is required'),
  purchase_order_id: z.string().optional(),
  purchase_order_name: z.string().optional(),
});

export const paymentStatusSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID format'),
});

export const paymentHistoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
});

export const createSubscriptionPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(255),
  price: z.number().min(100, 'Price must be at least 100 paisa (1 NPR)'),
  durationMonths: z.number().min(1, 'Duration must be at least 1 month'),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const updateSubscriptionPlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  price: z.number().min(100).optional(),
  durationMonths: z.number().min(1).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type InitiateSubscriptionInput = z.infer<
  typeof initiateSubscriptionSchema
>;
export type KhaltiCallbackInput = z.infer<typeof khaltiCallbackSchema>;
export type PaymentStatusInput = z.infer<typeof paymentStatusSchema>;
export type PaymentHistoryQueryInput = z.infer<
  typeof paymentHistoryQuerySchema
>;
export type CreateSubscriptionPlanInput = z.infer<
  typeof createSubscriptionPlanSchema
>;
export type UpdateSubscriptionPlanInput = z.infer<
  typeof updateSubscriptionPlanSchema
>;
