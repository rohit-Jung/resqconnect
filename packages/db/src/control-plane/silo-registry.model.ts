import { index } from 'drizzle-orm/pg-core';
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const siloStatusEnum = pgEnum('silo_status', [
  'active',
  'inactive',
  'stale',
]);

// Tracks every silo instance the control plane knows about.
// Each silo registers itself on boot and periodically heartbeats.
export const cpSiloRegistry = pgTable(
  'cp_silo_registry',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // The silo's own reachable URL (used as its identity key).
    siloBaseUrl: text('silo_base_url').notNull().unique(),

    sector: text('sector').notNull(),

    status: siloStatusEnum('status').notNull().default('active'),

    // How many orgs this silo currently manages.
    orgCount: integer('org_count').notNull().default(0),

    // Snapshot of orgs in this silo (names + ids) for reconciliation.
    orgs: jsonb('orgs')
      .$type<Array<{ id: string; name: string }>>()
      .notNull()
      .default([]),

    // Summary counts of incidents by status.
    incidentSummary: jsonb('incident_summary')
      .$type<{
        total: number;
        pending: number;
        active: number;
        completed: number;
        cancelled: number;
      }>()
      .notNull()
      .default({
        total: 0,
        pending: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
      }),

    // Whether this silo's data is fully synced to the control plane.
    synced: boolean('synced').notNull().default(false),

    lastHeartbeat: timestamp('last_heartbeat', { withTimezone: true })
      .notNull()
      .defaultNow(),

    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  t => [
    index('cp_silo_registry_heartbeat_idx').on(t.lastHeartbeat),
    index('cp_silo_registry_sector_idx').on(t.sector),
  ]
);
