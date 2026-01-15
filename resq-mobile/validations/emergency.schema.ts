import { z } from 'zod';

export const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

// Match backend ServiceTypeEnum
export const emergencyTypeSchema = z.enum(['ambulance', 'police', 'fire_truck', 'rescue_team']);

export const createEmergencyRequestSchema = z.object({
  emergencyType: emergencyTypeSchema,
  emergencyDescription: z.string().min(1, 'Please describe your emergency'),
  userLocation: locationSchema,
});

export type TCreateEmergencyRequest = z.infer<typeof createEmergencyRequestSchema>;
export type TLocation = z.infer<typeof locationSchema>;
export type TEmergencyType = z.infer<typeof emergencyTypeSchema>;
