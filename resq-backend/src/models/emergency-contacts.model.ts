import { relations } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { user } from './user.model';

export const emergencyContact = pgTable('emergency_contact', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  isCommanContact: boolean('is_comman_contact').notNull().default(false),
  relationship: varchar('relationship', { length: 50 }).notNull(),

  phoneNumber: varchar('phone_number', { length: 15 }).notNull(),
  email: varchar('email', { length: 255 }),
  userId: uuid('user_id'),

  // Notification preferences for this contact
  notifyOnEmergency: boolean('notify_on_emergency').default(true),
  notificationMethod: varchar('notification_method', { length: 20 }).default('sms'), // 'sms', 'push', 'both'
  pushToken: text('push_token'), // If contact has the app installed

  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const emergencyContactRelations = relations(emergencyContact, ({ one }) => ({
  userId: one(user, {
    fields: [emergencyContact.userId],
    references: [user.id],
  }),
}));

export const emergencyContactSchema = createSelectSchema(emergencyContact);
export const newEmergencyContactSchema = createInsertSchema(emergencyContact).pick({
  name: true,
  relationship: true,
  phoneNumber: true,
  email: true,
  notifyOnEmergency: true,
  notificationMethod: true,
});

export type TEmergencyContact = z.infer<typeof emergencyContactSchema>;
export type TNewEmergencyContact = z.infer<typeof newEmergencyContactSchema>;
