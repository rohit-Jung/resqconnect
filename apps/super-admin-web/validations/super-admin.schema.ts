import { z } from 'zod';

export const superAdminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const serviceCategoryValues = [
  'ambulance',
  'police',
  'fire_truck',
  'rescue_team',
] as const;
export type ServiceCategory = (typeof serviceCategoryValues)[number];

export const createOrganizationSchema = z
  .object({
    name: z.string().min(2, 'Organization name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
    generalNumber: z.string().min(3, 'Phone number must be at least 7 digits'),
    serviceCategory: z.enum([
      'ambulance',
      'police',
      'fire_truck',
      'rescue_team',
    ]),
    sector: z.enum(['hospital', 'police', 'fire']),
    siloBaseUrl: z.string().url('Please enter a valid silo base URL'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type TSuperAdminLogin = z.infer<typeof superAdminLoginSchema>;
export type TCreateOrganization = z.infer<typeof createOrganizationSchema>;
