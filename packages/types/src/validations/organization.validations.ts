import z from 'zod';

import { serviceTypes } from '../constants/service-types';
import { passwordSchema } from './password.validations';

const serviceTypeSchema = z.enum(serviceTypes);

export const registerOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255),
  email: z.email('Invalid email format'),
  serviceCategory: serviceTypeSchema,
  generalNumber: z.number().int('Phone number must be a valid integer'),
  password: passwordSchema,
});

export const loginOrganizationSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOrgOTPSchema = z.object({
  otpToken: z.string().min(1, 'OTP token is required'),
  organizationId: z.uuid('Invalid organization ID format'),
});

export const resendOrganizationVerificationOTPSchema = z.object({
  email: z.email('Invalid email format'),
});

export const updateOrgProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.email('Invalid email format').optional(),
  serviceCategory: serviceTypeSchema.optional(),
  generalNumber: z.number().int().optional(),
});

export const resetOrgPasswordSchema = z.object({
  otpToken: z.string().min(1, 'OTP token is required'),
  organizationId: z.uuid('Invalid organization ID format'),
  password: passwordSchema,
});

export const registerOrgServiceProviderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  age: z.number().int().min(18, 'Age must be at least 18'),
  email: z.email('Invalid email format'),
  phoneNumber: z.number().int('Phone number must be a valid integer'),
  primaryAddress: z.string().min(1, 'Address is required').max(255),
  password: passwordSchema,
  serviceType: serviceTypeSchema,
  // optional at registration time (org portal doesn't capture gps).
  currentLocation: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  vehicleInformation: z
    .object({
      type: z.string(),
      number: z.string(),
      model: z.string(),
      color: z.string(),
    })
    .optional(),
  panCardUrl: z.url('Invalid PAN card URL').optional().or(z.literal('')),
  citizenshipUrl: z.url('Invalid citizenship URL').optional().or(z.literal('')),
});

export const updateOrgServiceProviderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  age: z.number().int().min(18).optional(),
  email: z.email().optional(),
  phoneNumber: z.number().int().optional(),
  primaryAddress: z.string().min(1).max(255).optional(),
  serviceType: serviceTypeSchema.optional(),
  vehicleInformation: z
    .object({
      type: z.string(),
      number: z.string(),
      model: z.string(),
      color: z.string(),
    })
    .optional(),
});

const organizationValidations = {
  registerOrganizationSchema,
  loginOrganizationSchema,
  verifyOrgOTPSchema,
  resendOrganizationVerificationOTPSchema,
  updateOrgProfileSchema,
  resetOrgPasswordSchema,
  registerOrgServiceProviderSchema,
  updateOrgServiceProviderSchema,
} as const;

export { organizationValidations };

export type RegisterOrganizationInput = z.infer<
  typeof registerOrganizationSchema
>;
export type LoginOrganizationInput = z.infer<typeof loginOrganizationSchema>;
export type VerifyOrgOTPInput = z.infer<typeof verifyOrgOTPSchema>;
export type ResendOrganizationVerificationOTPInput = z.infer<
  typeof resendOrganizationVerificationOTPSchema
>;
export type UpdateOrgProfileInput = z.infer<typeof updateOrgProfileSchema>;
export type ResetOrgPasswordInput = z.infer<typeof resetOrgPasswordSchema>;
export type RegisterOrgServiceProviderInput = z.infer<
  typeof registerOrgServiceProviderSchema
>;
export type UpdateOrgServiceProviderInput = z.infer<
  typeof updateOrgServiceProviderSchema
>;
