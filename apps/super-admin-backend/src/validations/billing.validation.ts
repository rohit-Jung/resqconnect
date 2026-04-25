import { z } from 'zod';

export const createCheckoutSchema = z.object({
  // Organization registry ID (control-plane). We will later map this to silo org.
  orgId: z.uuidv4(),
  planId: z.uuidv4(),
  returnUrl: z.url().optional(),
  websiteUrl: z.url().optional(),
});

export const khaltiWebhookSchema = z.object({
  pidx: z.string().min(1),
});

export const khaltiVerifySchema = z.object({
  pidx: z.string().min(1),
});
