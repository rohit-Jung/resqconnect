import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

export const outboxStatusEnum = pgEnum('outbox_status', [
  'pending',
  'published',
  'failed',
]);

// Keep this schema package self-contained: use literal topic values.
export const kafkaTopicEnum = pgEnum('kafka_topic_enum', [
  'fire_events',
  'medical_events',
  'rescue_events',
  'police_events',
] as const);

export const outbox = pgTable('outbox', {
  id: uuid('id').defaultRandom().primaryKey(),
  aggregateId: uuid('aggregate_id').notNull(), // e.g., emergency request ID
  aggregateType: varchar('aggregate_type', { length: 100 }).notNull(), // e.g., 'emergency-request'
  eventType: varchar('event_type', { length: 100 }).notNull(), // e.g., 'created', 'accepted'
  kafkaTopic: kafkaTopicEnum('kafka_topic').notNull(),
  payload: text('payload').notNull(), // JSON stringified payload
  status: outboxStatusEnum('status').notNull().default('pending'),
  retryCount: integer('retry_count').default(0),
  lastRetryAt: timestamp('last_retry_at', { mode: 'string' }),
  publishedAt: timestamp('published_at', { mode: 'string' }),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
});

export const outboxSchema = createSelectSchema(outbox);
export const newOutboxSchema = createInsertSchema(outbox).pick({
  aggregateId: true,
  aggregateType: true,
  eventType: true,
  payload: true,
});

export type IOutbox = z.infer<typeof outboxSchema>;
export type ICreateOutbox = z.infer<typeof newOutboxSchema>;
