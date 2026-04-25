import z from 'zod';
import { type z as zType } from 'zod';

import { passwordSchema } from './password.validations';

export const verifyUserSchema = z.object({
  otpToken: z.string().min(1, 'OTP token is required'),
  userId: z.string().uuid('Invalid user ID format'),
});

export const resendUserVerificationOTPSchema = z.object({
  email: z.email('Invalid email format'),
});

export const forgotPasswordSchema = z
  .object({
    email: z.string().email('Invalid email format').optional(),
    phoneNumber: z.number().optional(),
  })
  .refine(
    (data: { email?: string; phoneNumber?: number }) =>
      data.email || data.phoneNumber,
    {
      message: 'Please provide email or phone number',
    }
  );

export const resetPasswordSchema = z.object({
  otpToken: z.string().min(1, 'OTP token is required'),
  userId: z.string().uuid('Invalid user ID format'),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: passwordSchema,
});

export const updatePushTokenSchema = z.object({
  pushToken: z.string().min(1, 'Push token is required'),
});

export const updateEmergencySettingsSchema = z
  .object({
    notifyEmergencyContacts: z.boolean().optional(),
    emergencyNotificationMethod: z.enum(['sms', 'push', 'both']).optional(),
  })
  .refine(
    (data: {
      notifyEmergencyContacts?: boolean;
      emergencyNotificationMethod?: 'sms' | 'push' | 'both';
    }) =>
      data.notifyEmergencyContacts !== undefined ||
      data.emergencyNotificationMethod,
    {
      message: 'No valid settings to update',
    }
  );

export type TVerifyUser = zType.infer<typeof verifyUserSchema>;
export type TResendUserVerificationOTP = zType.infer<
  typeof resendUserVerificationOTPSchema
>;
export type TForgotPassword = zType.infer<typeof forgotPasswordSchema>;
export type TResetPassword = zType.infer<typeof resetPasswordSchema>;
export type TChangePassword = zType.infer<typeof changePasswordSchema>;
export type TUpdatePushToken = zType.infer<typeof updatePushTokenSchema>;
export type TUpdateEmergencySettings = zType.infer<
  typeof updateEmergencySettingsSchema
>;
