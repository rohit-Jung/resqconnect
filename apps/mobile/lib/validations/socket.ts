import z from 'zod';

export const newEmergencyEventPayloadSchema = z.object({
  requestId: z.string(),
  userId: z.string(),
  emergencyType: z.string(),
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

export type TNewEmergencyEventPayload = z.infer<
  typeof newEmergencyEventPayloadSchema
>;

// Helper type with computed properties for easier UI usage
export type IncomingRequestData = TNewEmergencyEventPayload & {
  // Alias for emergencyLocation
  location: { latitude: number; longitude: number };
  // Alias for emergencyDescription
  description?: string;
};
