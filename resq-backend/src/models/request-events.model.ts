import { relations } from 'drizzle-orm';
import { json, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

import { emergencyRequest } from './emergency-request.model';
import { serviceProvider } from './service-provider.model';

export const requestEvents = pgTable('request_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id')
    .references(() => emergencyRequest.id)
    .notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  providerId: uuid('provider_id').references(() => serviceProvider.id),
  metadata: json('metadata').$type<Record<string, unknown>>(),
  timestamp: timestamp('timestamp', { mode: 'string' }).notNull().defaultNow(),
});

export const requestEventsRelations = relations(requestEvents, ({ one }) => ({
  request: one(emergencyRequest, {
    fields: [requestEvents.requestId],
    references: [emergencyRequest.id],
  }),
  provider: one(serviceProvider, {
    fields: [requestEvents.providerId],
    references: [serviceProvider.id],
  }),
}));

export const requestEventsSchema = createSelectSchema(requestEvents);
export const newRequestEventSchema = createInsertSchema(requestEvents).pick({
  requestId: true,
  eventType: true,
  providerId: true,
  metadata: true,
});

export type IRequestEvent = z.infer<typeof requestEventsSchema>;
export type ICreateRequestEvent = z.infer<typeof newRequestEventSchema>;
