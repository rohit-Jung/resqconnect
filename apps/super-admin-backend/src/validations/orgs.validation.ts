import { z } from 'zod';

export const provisionOrgSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  serviceCategory: z.enum(['ambulance', 'police', 'rescue_team', 'fire_truck']),
  generalNumber: z.number().int().positive(),
  password: z.string().min(8),
  sector: z.enum(['hospital', 'police', 'fire']),
  siloBaseUrl: z.string().url(),
});

export const updateOrgStatusSchema = z.object({
  status: z.enum(['pending_approval', 'active', 'suspended', 'trial_expired']),
});
