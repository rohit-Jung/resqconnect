import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  customType,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { ServiceTypeEnum } from '../constants';
import { organization } from './organization.model';

const geometry = customType<{ data: string }>({
  dataType() {
    return 'geometry(Point, 4326)';
  },
});

export const statusTypeEnum = pgEnum('service_status', [
  'available',
  'assigned',
  'off_duty',
]);

const serviceTypeEnum = pgEnum('service_type', [
  ServiceTypeEnum.AMBULANCE,
  ServiceTypeEnum.POLICE,
  ServiceTypeEnum.RESCUE_TEAM,
  ServiceTypeEnum.FIRE_TRUCK,
] as const);

export const serviceProvider = pgTable(
  'service_provider',
  {
    id: uuid('id').defaultRandom().primaryKey().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    age: integer('age').notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phoneNumber: bigint('phone_number', { mode: 'number' }).notNull().unique(),
    primaryAddress: varchar('primary_address', { length: 255 }).notNull(),
    serviceArea: varchar('service_area').default('Kathmandu Valley'),
    password: varchar('password', { length: 255 }).notNull(),
    serviceType: serviceTypeEnum('service_type').notNull(),
    isVerified: boolean('is_verified').default(false),
    profilePicture: varchar('profile_picture', { length: 255 }),

    // PostGIS Point for exact last known location
    lastLocation: geometry('last_location').notNull(),

    // H3 Index (stored as a BigInt) for fast matching
    // Resolution 7 or 8 is usually best for city-wide emergency dispatch
    h3Index: bigint('h3_index', { mode: 'bigint' }).notNull(),

    currentLocation: json('current_location')
      .$type<{
        latitude: string;
        longitude: string;
      }>()
      .default({
        latitude: '',
        longitude: '',
      }),

    vehicleInformation: json('vehicle_information')
      .$type<{
        type: string;
        number: string;
        model: string;
        color: string;
      }>()
      .default({
        type: 'Not filled',
        number: 'Not filled',
        model: 'Not filled',
        color: 'Not filled',
      }),

    organizationId: uuid('organization_id')
      .references(() => organization.id, { onDelete: 'cascade' })
      .notNull(),
    serviceStatus: statusTypeEnum('service_status')
      .notNull()
      .default('available'),
    verificationToken: varchar('verification_token', { length: 255 }),
    tokenExpiry: timestamp('token_expiry', { mode: 'string' }),

    resetPasswordToken: varchar('reset_password_token', { length: 255 }),
    resetPasswordTokenExpiry: timestamp('reset_password_token_expiry', {
      mode: 'string',
    }),

    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  t => [index('spatial_idx').on(t.lastLocation), index('h3_idx').on(t.h3Index)],
);

export const serviceProviderRelations = relations(
  serviceProvider,
  ({ one }) => ({
    organization: one(organization, {
      fields: [serviceProvider.organizationId],
      references: [organization.id],
    }),
  }),
);

// Define the serviceProvider schema
export const serviceProviderSchema = createSelectSchema(serviceProvider);
export const newServiceProviderSchema = serviceProviderSchema.pick({
  name: true,
  age: true,
  email: true,
  phoneNumber: true,
  primaryAddress: true,
  password: true,
  serviceType: true,
  organizationId: true,
});

export const loginServiceProviderSchema = createInsertSchema(
  serviceProvider,
).pick({
  phoneNumber: true,
  password: true,
});

export type TNewServiceProvider = z.infer<typeof newServiceProviderSchema>;
export type TServiceProvider = z.infer<typeof serviceProviderSchema>;
