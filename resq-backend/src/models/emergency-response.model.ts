import { relations } from 'drizzle-orm';
import {
  json,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { emergencyRequest } from './emergency-request.model.ts';
import { serviceProvider } from './service-provider.model.ts';

export const statusUpdateEnum = pgEnum('status_update', [
  'accepted',
  'arrived',
  'on_route',
  'rejected',
]);

export const emergencyResponse = pgTable('emergency_response', {
  id: uuid('id').defaultRandom().primaryKey(),
  emergencyRequestId: uuid('emergency_request_id').references(
    () => emergencyRequest.id,
  ),
  serviceProviderId: uuid('service_provider_id').references(
    () => serviceProvider.id,
  ),

  statusUpdate: statusUpdateEnum('status_update').default('accepted'),
  originLocation: json('origin_location')
    .$type<{
      latitude: string;
      longitude: string;
    }>()
    .notNull(),
  destinationLocation: json('destination_location')
    .$type<{
      latitude: string;
      longitude: string;
    }>()
    .notNull(),

  assignedAt: timestamp('assigned_at'),
  respondedAt: timestamp('responded_at').defaultNow(),
  updateDescription: varchar({ length: 255 }),

  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const emergencyResponseRelations = relations(
  emergencyResponse,
  ({ one }) => ({
    emergencyRequestId: one(emergencyRequest, {
      fields: [emergencyResponse.emergencyRequestId],
      references: [emergencyRequest.id],
    }),

    serviceProviderId: one(serviceProvider, {
      fields: [emergencyResponse.serviceProviderId],
      references: [serviceProvider.id],
      relationName: 'emergency_requests',
    }),
  }),
);

export const emergencyResponseSchema = createSelectSchema(emergencyResponse);
export type TEmergencyResponse = z.infer<typeof emergencyResponseSchema>;
