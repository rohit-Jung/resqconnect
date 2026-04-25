import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const cpSectorEnum = pgEnum('cp_sector', ['hospital', 'police', 'fire']);

export const cpOrgStatusEnum = pgEnum('cp_org_status', [
  'pending_approval',
  'active',
  'suspended',
  'trial_expired',
]);

// minimal control-plane table: global org registry + silo lookup.
export const cpOrganization = pgTable('cp_organization', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  sector: cpSectorEnum('sector').notNull(),
  status: cpOrgStatusEnum('status').notNull().default('pending_approval'),
  siloBaseUrl: text('silo_base_url').notNull(),
  // the org uuid inside the silo db (created via internal provision endpoint).
  siloOrgId: uuid('silo_org_id'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
