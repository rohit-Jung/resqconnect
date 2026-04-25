import z from 'zod';
import { type z as zType } from 'zod';

import { passwordSchema } from './password.validations';

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
  password: passwordSchema,
});

export const changeProviderPasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: passwordSchema,
});

export const verifyServiceProviderSchema = z.object({
  otpToken: z.string().min(1, 'OTP token is required'),
  providerId: z.string().uuid('Invalid provider ID format'),
});

export const resendServiceProviderVerificationOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const serviceProviderValidations = {
  updateServiceProviderSchema,
  updateServiceProviderLocationSchema,
  updateServiceProviderStatusSchema,
  forgotServiceProviderPasswordSchema,
  resetServiceProviderPasswordSchema,
  changeProviderPasswordSchema,
  verifyServiceProviderSchema,
  resendServiceProviderVerificationOTPSchema,
} as const;

export { serviceProviderValidations };

export type UpdateServiceProviderInput = zType.infer<
  typeof updateServiceProviderSchema
>;
export type UpdateServiceProviderLocationInput = zType.infer<
  typeof updateServiceProviderLocationSchema
>;
export type UpdateServiceProviderStatusInput = zType.infer<
  typeof updateServiceProviderStatusSchema
>;
export type ForgotServiceProviderPasswordInput = zType.infer<
  typeof forgotServiceProviderPasswordSchema
>;
export type ResetServiceProviderPasswordInput = zType.infer<
  typeof resetServiceProviderPasswordSchema
>;
export type ChangeProviderPasswordInput = zType.infer<
  typeof changeProviderPasswordSchema
>;
export type VerifyServiceProviderInput = zType.infer<
  typeof verifyServiceProviderSchema
>;
export type ResendServiceProviderVerificationOTPInput = zType.infer<
  typeof resendServiceProviderVerificationOTPSchema
>;
