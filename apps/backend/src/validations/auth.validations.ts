import { z } from 'zod';

export const verifyUserSchema = z.object({
  otpToken: z.string().min(1, 'OTP token is required'),
  userId: z.string().uuid('Invalid user ID format'),
});

export const forgotPasswordSchema = z
  .object({
    email: z.string().email('Invalid email format').optional(),
    phoneNumber: z.number().optional(),
  })
  .refine(data => data.email || data.phoneNumber, {
    message: 'Please provide email or phone number',
  });

export const resetPasswordSchema = z.object({
  otpToken: z.string().min(1, 'OTP token is required'),
  userId: z.string().uuid('Invalid user ID format'),
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

export const changePasswordSchema = z.object({
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

export const updatePushTokenSchema = z.object({
  pushToken: z.string().min(1, 'Push token is required'),
});

export const updateEmergencySettingsSchema = z
  .object({
    notifyEmergencyContacts: z.boolean().optional(),
    emergencyNotificationMethod: z.enum(['sms', 'push', 'both']).optional(),
  })
  .refine(
    data =>
      data.notifyEmergencyContacts !== undefined ||
      data.emergencyNotificationMethod,
    {
      message: 'No valid settings to update',
    }
  );

export type TVerifyUser = z.infer<typeof verifyUserSchema>;
export type TForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type TResetPassword = z.infer<typeof resetPasswordSchema>;
export type TChangePassword = z.infer<typeof changePasswordSchema>;
export type TUpdatePushToken = z.infer<typeof updatePushTokenSchema>;
export type TUpdateEmergencySettings = z.infer<
  typeof updateEmergencySettingsSchema
>;
