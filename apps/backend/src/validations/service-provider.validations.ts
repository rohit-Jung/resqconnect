import { z } from 'zod';

export const updateServiceProviderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  age: z.number().int().min(18).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.number().int().optional(),
  primaryAddress: z.string().min(1).max(255).optional(),
  profilePicture: z.string().url().optional(),
  serviceArea: z.string().optional(),
  vehicleInformation: z
    .object({
      type: z.string(),
      number: z.string(),
      model: z.string(),
      color: z.string(),
    })
    .optional(),
});

export const updateServiceProviderLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const updateServiceProviderStatusSchema = z.object({
  serviceStatus: z.enum(['available', 'assigned', 'off_duty']),
});

export const forgotServiceProviderPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetServiceProviderPasswordSchema = z.object({
  otpToken: z.string().min(1, 'OTP token is required'),
  providerId: z.string().uuid('Invalid provider ID format'),
  password: z
    .string()
    .min(9, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
});

export const changeProviderPasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z
    .string()
    .min(9, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
});

export const verifyServiceProviderSchema = z.object({
  otpToken: z.string().min(1, 'OTP token is required'),
  providerId: z.string().uuid('Invalid provider ID format'),
});

export type UpdateServiceProviderInput = z.infer<
  typeof updateServiceProviderSchema
>;
export type UpdateServiceProviderLocationInput = z.infer<
  typeof updateServiceProviderLocationSchema
>;
export type UpdateServiceProviderStatusInput = z.infer<
  typeof updateServiceProviderStatusSchema
>;
export type ForgotServiceProviderPasswordInput = z.infer<
  typeof forgotServiceProviderPasswordSchema
>;
export type ResetServiceProviderPasswordInput = z.infer<
  typeof resetServiceProviderPasswordSchema
>;
export type ChangeProviderPasswordInput = z.infer<
  typeof changeProviderPasswordSchema
>;
export type VerifyServiceProviderInput = z.infer<
  typeof verifyServiceProviderSchema
>;
