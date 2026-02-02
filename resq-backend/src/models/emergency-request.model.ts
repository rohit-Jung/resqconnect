import { relations } from 'drizzle-orm';
import {
  bigint,
  customType,
  integer,
  json,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

import { serviceTypeEnum } from '../constants';
import { serviceProvider } from './service-provider.model';
import { user } from './user.model';

export const requestStatusEnum = pgEnum('request_status', [
  'pending',
  'accepted',
  'assigned',
  'rejected',
  'in_progress',
  'completed',
  'cancelled',
  'no_providers_available',
]);

// Custom PostGIS geometry type
const geometry = customType<{ data: string }>({
  dataType() {
    return 'geometry(Point, 4326)';
  },
});

export const emergencyRequest = pgTable('emergency_request', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => user.id)
    .notNull(),
  serviceType: serviceTypeEnum('service_type').notNull(),
  requestStatus: requestStatusEnum('request_status').notNull().default('pending'),

  description: varchar({ length: 255 }),
  requestTimeout: integer().default(120), // 2 minutes default

  // Location fields
  location: json('location')
    .$type<{
      latitude: number;
      longitude: number;
    }>()
    .notNull(),

  // PostGIS Point for spatial queries
  geoLocation: geometry('geo_location'),

  // H3 Index for fast spatial lookups
  h3Index: bigint('h3_index', { mode: 'bigint' }),

  // Search escalation fields
  searchRadius: integer('search_radius').default(1), // k-ring radius
  mustConnectBy: timestamp('must_connect_by', { mode: 'string' }),
  providerConnectedAt: timestamp('provider_connected_at', { mode: 'string' }),

  expiresAt: timestamp('expires_at', { mode: 'string' }),

  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const emergencyRequestRelations = relations(emergencyRequest, ({ one }) => ({
  user: one(user, {
    fields: [emergencyRequest.userId],
    references: [user.id],
  }),
}));

// Schemas
export const emergencyRequestSchema = createSelectSchema(emergencyRequest);
export const newEmergencyRequestSchema = createInsertSchema(emergencyRequest).pick({
  userId: true,
  serviceType: true,
  description: true,
  location: true,
});


export type IEmergencyRequest = z.infer<typeof emergencyRequestSchema>;
export type ICreateEmergencyRequest = z.infer<typeof newEmergencyRequestSchema>;
