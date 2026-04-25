import { uniqueIndex } from 'drizzle-orm/pg-core';
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Latest known organization snapshot pulled from silos.
export const cpOrgReplica = pgTable(
  'cp_org_replica',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cpOrgId: uuid('cp_org_id').notNull(),
    siloBaseUrl: text('silo_base_url').notNull(),
    siloOrgId: uuid('silo_org_id').notNull(),

    snapshot: jsonb('snapshot').$type<Record<string, unknown>>().notNull(),
    capturedAt: timestamp('captured_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  t => [
    uniqueIndex('cp_org_replica_silo_org_uq').on(t.siloBaseUrl, t.siloOrgId),
  ]
);
