import { relations } from 'drizzle-orm';
import { integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

import { serviceProvider } from './service-provider.model.ts';
import { user } from './user.model';

export const feedback = pgTable('feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => user.id)
    .notNull(),
  serviceProviderId: uuid('serviceProvider_id')
    .references(() => serviceProvider.id)
    .notNull(),
  message: varchar('message', { length: 255 * 2 }),
  serviceRatings: integer('service_ratings'),

  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const feedbackRelations = relations(feedback, ({ one }) => ({
  userId: one(user, {
    fields: [feedback.userId],
    references: [user.id],
  }),

  serviceProviderId: one(serviceProvider, {
    fields: [feedback.serviceProviderId],
    references: [serviceProvider.id],
  }),
}));

export const feedbackSchema = createSelectSchema(feedback);
export type TFeedback = z.infer<typeof feedbackSchema>;
