import { z } from 'zod';

export enum UserRoles {
  USER = 'user',
  ADMIN = 'admin',
}

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const loginUserSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

// Form schema (for react-hook-form with string inputs)
export const userRegisterFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Please enter a valid email'),
    phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
    age: z.string().min(1, 'Age is required'),
    primaryAddress: z.string().min(1, 'Primary address is required'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// API schema (for actual API call)
export const userRegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  name: z.string().min(1, 'Name is required'),
  fullName: z.string().min(1, 'Full name is required'),
  phoneNumber: z.number().int().positive('Phone number is required'),
  age: z.number().int().min(1, 'Age must be at least 1').max(120, 'Invalid age'),
  email: z.string().email('Please enter a valid email'),
  password: passwordSchema,
  primaryAddress: z.string().min(1, 'Primary address is required'),
  role: z.nativeEnum(UserRoles).default(UserRoles.USER),
  termsAccepted: z.literal(true, {
    message: 'You must accept the terms and conditions',
  }),
});

export const verifyUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  otpToken: z.string().length(6, 'OTP must be 6 digits'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export const resetPasswordFormSchema = z
  .object({
    otpToken: z.string().length(6, 'OTP must be 6 digits'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  otpToken: z.string().length(6, 'OTP must be 6 digits'),
  password: passwordSchema,
});

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type TLoginUser = z.infer<typeof loginUserSchema>;
export type TRegisterUserForm = z.infer<typeof userRegisterFormSchema>;
export type TRegisterUser = z.infer<typeof userRegisterSchema>;
export type TVerifyUser = z.infer<typeof verifyUserSchema>;
export type TForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type TResetPasswordForm = z.infer<typeof resetPasswordFormSchema>;
export type TResetPassword = z.infer<typeof resetPasswordSchema>;
export type TChangePassword = z.infer<typeof changePasswordSchema>;
