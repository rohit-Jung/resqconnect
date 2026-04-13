import z from 'zod';

import { ServiceTypeEnum } from '@/constants';

export const CreateNewRequestSchema = z.object({
  emergencyType: z.enum(ServiceTypeEnum),
  emergencyDescription: z.string().optional(),
  userLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});

export const EmergencyRequestPayload = z.object({
  requestId: z.string(),
  userId: z.string(),
  emergencyType: z.enum(ServiceTypeEnum),
  emergencyLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),

  status: z.string(),
  h3Index: z.string(),

  emergencyDescription: z.string().optional(),
  expiresAt: z.string().optional(),

  // Additional fields added by backend
  username: z.string().optional(),
  userPhone: z.string().optional(),
  userEmail: z.string().optional(),
});

export type IEmergencyRequestPayload = z.infer<typeof EmergencyRequestPayload>;
