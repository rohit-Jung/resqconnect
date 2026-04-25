import z from 'zod';

import { serviceTypes } from '../constants/service-types';

const serviceTypeSchema = z.enum(serviceTypes);

export const CreateNewRequestSchema = z.object({
  emergencyType: serviceTypeSchema,
  emergencyDescription: z.string().optional(),
  userLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});

export const EmergencyRequestPayload = z.object({
  requestId: z.string(),
  userId: z.string(),
  emergencyType: serviceTypeSchema,
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

const emergencyRequestValidations = {
  CreateNewRequestSchema,
  EmergencyRequestPayload,
} as const;

export { emergencyRequestValidations };

export type IEmergencyRequestPayload = z.infer<typeof EmergencyRequestPayload>;
