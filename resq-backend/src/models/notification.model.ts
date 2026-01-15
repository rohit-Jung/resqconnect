import { relations } from 'drizzle-orm';
import {
  boolean,
  json,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { serviceProvider } from './service-provider.model';
import { user } from './user.model';

export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);

export const notifications = pgTable('notification', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => user.id),
  serviceProviderId: uuid('service_provider_id').references(
    () => serviceProvider.id
  ),
  message: varchar({ length: 255 }).notNull(),
  type: varchar({ length: 50 }).notNull(),
  priority: priorityEnum('priority').default('low'),
  source: varchar({ length: 100 }).notNull(),
  metadata: json('metadata'),
  deliveryStatus: varchar({ length: 50 }).default('pending'),

  isRead: boolean('is_read').default(false),
  doNotDisturb: boolean('do_not_disturb').default(false),

  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const notificationRelations = relations(notifications, ({ one }) => ({
  userId: one(user, {
    fields: [notifications.userId],
    references: [user.id],
  }),

  serviceProviderId: one(serviceProvider, {
    fields: [notifications.serviceProviderId],
    references: [serviceProvider.id],
  }),
}));

export const notificationSchema = createSelectSchema(notifications);
export type TNotification = z.infer<typeof notificationSchema>;
