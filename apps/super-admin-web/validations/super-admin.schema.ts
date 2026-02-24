import { z } from 'zod';

export const superAdminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export type TSuperAdminLogin = z.infer<typeof superAdminLoginSchema>;
