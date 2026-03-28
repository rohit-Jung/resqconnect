import { emergencyRequestSchema } from '@/models';

export const messageSchema = emergencyRequestSchema.pick({
  userId: true,
  location: true,
  serviceType: true,
  description: true,
});
