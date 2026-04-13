import { z } from 'zod';

import { ServiceTypeEnum } from '@/constants';

export const registerOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255),
  email: z.string().email('Invalid email format'),
  serviceCategory: z.enum([...ServiceTypeEnum] as const, {
    errorMap: () => ({ message: 'Invalid service category' }),
  }),
  generalNumber: z.number().int('Phone number must be a valid integer'),
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

export const loginOrganizationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOrgOTPSchema = z.object({
  otpToken: z.string().min(1, 'OTP token is required'),
  organizationId: z.string().uuid('Invalid organization ID format'),
});

export const updateOrgProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email('Invalid email format').optional(),
  serviceCategory: z.enum(ServiceTypeEnum).optional(),
  generalNumber: z.number().int().optional(),
});

export const resetOrgPasswordSchema = z.object({
  otpToken: z.string().min(1, 'OTP token is required'),
  organizationId: z.string().uuid('Invalid organization ID format'),
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

export const registerOrgServiceProviderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  age: z.number().int().min(18, 'Age must be at least 18'),
  email: z.string().email('Invalid email format'),
  phoneNumber: z.number().int('Phone number must be a valid integer'),
  primaryAddress: z.string().min(1, 'Address is required').max(255),
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
  serviceType: z.enum(ServiceTypeEnum),
  currentLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  vehicleInformation: z
    .object({
      type: z.string(),
      number: z.string(),
      model: z.string(),
      color: z.string(),
    })
    .optional(),
});

export const updateOrgServiceProviderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  age: z.number().int().min(18).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.number().int().optional(),
  primaryAddress: z.string().min(1).max(255).optional(),
  serviceType: z.enum(ServiceTypeEnum).optional(),
  vehicleInformation: z
    .object({
      type: z.string(),
      number: z.string(),
      model: z.string(),
      color: z.string(),
    })
    .optional(),
});

export type RegisterOrganizationInput = z.infer<
  typeof registerOrganizationSchema
>;
export type LoginOrganizationInput = z.infer<typeof loginOrganizationSchema>;
export type VerifyOrgOTPInput = z.infer<typeof verifyOrgOTPSchema>;
export type UpdateOrgProfileInput = z.infer<typeof updateOrgProfileSchema>;
export type ResetOrgPasswordInput = z.infer<typeof resetOrgPasswordSchema>;
export type RegisterOrgServiceProviderInput = z.infer<
  typeof registerOrgServiceProviderSchema
>;
export type UpdateOrgServiceProviderInput = z.infer<
  typeof updateOrgServiceProviderSchema
>;
