import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Control-plane admin users (used by super-admin-web).
// Seeded from environment variables in apps/super-admin-backend.
export const cpAdmin = pgTable('cp_admin', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
