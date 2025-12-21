import { UserRoles } from '../constants';
import {
  bigint,
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const userRolesEnum = pgEnum('role', [
  UserRoles.USER,
  UserRoles.ADMIN,
] as const);

export const user = pgTable('user', {
  id: uuid('id').defaultRandom().primaryKey().unique(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  phoneNumber: bigint('phone_number', { mode: 'number' }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  primaryAddress: varchar('primary_address', { length: 255 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  isVerified: boolean('is_verified').default(false),
  role: userRolesEnum().default(UserRoles.USER),
  profilePicture: varchar('profile_picture', { length: 255 }),
  verificationToken: varchar('verification_token', { length: 255 }),
  tokenExpiry: timestamp('token_expiry', { mode: 'string' }),
  currentLocation: json('current_location')
    .$type<{
      latitude: string;
      longitude: string;
    }>()
    .default({
      latitude: '',
      longitude: '',
    }),

  resetPasswordToken: varchar('reset_password_token', { length: 255 }),
  resetPasswordTokenExpiry: timestamp('reset_password_token_expiry', {
    mode: 'string',
  }),

  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),

  pushToken: text('push_token'),
});

export const usersSchema = createSelectSchema(user);
export const newUserSchema = createInsertSchema(user)
  .pick({
    name: true,
    age: true,
    phoneNumber: true,
    email: true,
    primaryAddress: true,
    role: true,
    password: true,
  })
  .extend({
    password: z
      .string()
      .min(9, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character',
      ),
    termsAccepted: z.boolean(),
  });

export const loginUserSchema = createInsertSchema(user).pick({
  email: true,
  password: true,
});

export const userRolesSchema = createSelectSchema(userRolesEnum);
export type TUserRole = z.infer<typeof userRolesSchema>;
export type TUser = z.infer<typeof usersSchema>;
export type TNewUser = z.infer<typeof newUserSchema>;
