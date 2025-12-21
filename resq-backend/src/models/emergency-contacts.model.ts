import { relations } from 'drizzle-orm';
import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { user } from './user.model';

export const emergencyContact = pgTable('emergency_contact', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  isCommanContact: boolean('is_comman_contact').notNull().default(false),
  relationship: varchar('relationship', { length: 50 }).notNull(),

  phoneNumber: varchar('phone_number', { length: 15 }).notNull(),
  userId: uuid('user_id'),

  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const emergencyContactRelations = relations(
  emergencyContact,
  ({ one }) => ({
    userId: one(user, {
      fields: [emergencyContact.userId],
      references: [user.id],
    }),
  }),
);

export const emergencyContactSchema = createSelectSchema(emergencyContact);
export type TEmergencyContact = z.infer<typeof emergencyContactSchema>;
