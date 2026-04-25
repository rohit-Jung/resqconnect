import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

import { serviceTypeEnum } from '.';
import { serviceProvider } from './service-provider.model';

// Legacy org status enum used by earlier code paths.
// Keep this separate from lifecycle enforcement.
export const orgStatusEnum = pgEnum('org_status', [
  'not_active',
  'active',
  'not_verified',
]);

// Org lifecycle status (approval/billing enforcement).
export const orgLifecycleStatusEnum = pgEnum('org_lifecycle_status', [
  'pending_approval',
  'active',
  'suspended',
  'trial_expired',
]);

export const organization = pgTable('organization', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  serviceCategory: serviceTypeEnum('service_category').notNull(),
  generalNumber: bigint('general_number', { mode: 'number' }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  isVerified: boolean('is_verified').default(false),
  status: orgStatusEnum('org_status').notNull().default('not_verified'),

  // Used by silo enforcement. Defaults to 'active' to avoid breaking existing orgs.
  lifecycleStatus: orgLifecycleStatusEnum('lifecycle_status')
    .notNull()
    .default('pending_approval'),

  verificationToken: varchar('verification_token', { length: 255 }),
  tokenExpiry: timestamp('token_expiry', { mode: 'string' }),

  resetPasswordToken: varchar('reset_password_token', { length: 255 }),
  resetPasswordTokenExpiry: timestamp('reset_password_token_expiry', {
    mode: 'string',
  }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const organizationRelations = relations(organization, ({ many }) => ({
  serviceProviders: many(serviceProvider),
}));

export const organizationSchema = createSelectSchema(organization);
export const newOrganizationSchema = createInsertSchema(organization).pick({
  name: true,
  email: true,
  serviceCategory: true,
  generalNumber: true,
  password: true,
});

export type TOrganization = z.infer<typeof organizationSchema>;
export type TNewOrganization = z.infer<typeof newOrganizationSchema>;
